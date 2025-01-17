import { Router } from "express";
import { db } from "@db";
import { workspaces, userWorkspaces, channels, users } from "@db/schema";
import { eq, and } from "drizzle-orm";
import type { Request, Response } from "express";
import { isAuthenticated } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// Input validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  description: z.string().optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  description: z.string().optional(),
});

// Add validation schema for member addition
const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * @route GET /workspaces
 * @desc List all workspaces that authenticated user is a member of
 */
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const workspacesList = await db
      .select({
        workspaceId: workspaces.workspaceId,
        name: workspaces.name,
        description: workspaces.description,
        archived: workspaces.archived,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaces)
      .innerJoin(
        userWorkspaces,
        and(
          eq(userWorkspaces.workspaceId, workspaces.workspaceId),
          eq(userWorkspaces.userId, req.user!.userId),
        ),
      );

    res.json(workspacesList);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: {
        code: "SERVER_ERROR",
        message: "Failed to fetch workspaces",
      },
    });
  }
});

/**
 * @route POST /workspaces
 * @desc Create a new workspace with a default general channel
 */
router.post("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = createWorkspaceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Bad Request",
        details: {
          code: "VALIDATION_ERROR",
          message: "Invalid workspace data",
          errors: validationResult.error.errors,
        },
      });
    }

    const { name, description } = validationResult.data;

    // Create workspace
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name,
        description,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    // Add creator as workspace owner
    await db.insert(userWorkspaces).values({
      userId: req.user!.userId,
      workspaceId: workspace.workspaceId,
      role: "OWNER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create default general channel
    await db.insert(channels).values({
      workspaceId: workspace.workspaceId,
      name: "general",
      topic: "Default channel for general discussions",
      channelType: "PUBLIC",
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error("Error creating workspace:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: {
        code: "SERVER_ERROR",
        message: "Failed to create workspace",
      },
    });
  }
});

/**
 * @route GET /workspaces/:workspaceId
 * @desc Get workspace details
 */
router.get(
  "/:workspaceId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.params;
      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.workspaceId, parseInt(workspaceId)),
      });

      if (!workspace) {
        return res.status(404).json({
          error: "Workspace Not Found",
          details: {
            code: "WORKSPACE_NOT_FOUND",
            message: "The requested workspace does not exist",
          },
        });
      }

      res.json(workspace);
    } catch (error) {
      console.error("Error fetching workspace:", error);
      res.status(500).json({
        error: "Internal Server Error",
        details: {
          code: "SERVER_ERROR",
          message: "Failed to fetch workspace",
        },
      });
    }
  },
);

/**
 * @route PUT /workspaces/:workspaceId
 * @desc Update a workspace
 */
router.put(
  "/:workspaceId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.params;

      // Validate input
      const validationResult = updateWorkspaceSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Bad Request",
          details: {
            code: "VALIDATION_ERROR",
            message: "Invalid workspace data",
            errors: validationResult.error.errors,
          },
        });
      }

      const { name, description } = validationResult.data;

      const [workspace] = await db
        .update(workspaces)
        .set({
          name,
          description,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.workspaceId, parseInt(workspaceId)))
        .returning();

      if (!workspace) {
        return res.status(404).json({
          error: "Workspace Not Found",
          details: {
            code: "WORKSPACE_NOT_FOUND",
            message: "The requested workspace does not exist",
          },
        });
      }

      res.json(workspace);
    } catch (error) {
      console.error("Error updating workspace:", error);
      res.status(500).json({
        error: "Internal Server Error",
        details: {
          code: "SERVER_ERROR",
          message: "Failed to update workspace",
        },
      });
    }
  },
);

/**
 * @route DELETE /workspaces/:workspaceId
 * @desc Archive (soft-delete) a workspace
 */
router.delete(
  "/:workspaceId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.params;

      const [workspace] = await db
        .update(workspaces)
        .set({
          archived: true,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.workspaceId, parseInt(workspaceId)))
        .returning();

      if (!workspace) {
        return res.status(404).json({
          error: "Workspace Not Found",
          details: {
            code: "WORKSPACE_NOT_FOUND",
            message: "The requested workspace does not exist",
          },
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error archiving workspace:", error);
      res.status(500).json({
        error: "Internal Server Error",
        details: {
          code: "SERVER_ERROR",
          message: "Failed to archive workspace",
        },
      });
    }
  },
);

/**
 * @route GET /workspaces/{workspaceId}/members
 * @desc Get all members of a workspace
 */
router.get('/:workspaceId/members', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;

    // First check if workspace exists
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.workspaceId, parseInt(workspaceId))
    });

    if (!workspace) {
      return res.status(404).json({
        error: "Not Found",
        details: {
          code: "WORKSPACE_NOT_FOUND",
          message: "The requested workspace does not exist"
        }
      });
    }

    // Check if user is a member of the workspace
    const userMembership = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.workspaceId, parseInt(workspaceId)),
          eq(userWorkspaces.userId, req.user!.userId)
        )
      )
      .limit(1);

    if (!userMembership.length) {
      return res.status(403).json({
        error: "Forbidden",
        details: {
          code: "NOT_WORKSPACE_MEMBER",
          message: "You are not a member of this workspace"
        }
      });
    }

    // Get all workspace members
    const workspaceMembers = await db
      .select({
        userId: users.userId,
        email: users.email,
        displayName: users.displayName,
        lastKnownPresence: users.lastKnownPresence,
        role: userWorkspaces.role,
        joinedAt: userWorkspaces.createdAt
      })
      .from(userWorkspaces)
      .innerJoin(users, eq(users.userId, userWorkspaces.userId))
      .where(
        and(
          eq(userWorkspaces.workspaceId, parseInt(workspaceId)),
          eq(users.deactivated, false)
        )
      )
      .orderBy(userWorkspaces.createdAt);

    res.json(workspaceMembers);
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    res.status(500).json({
      error: "Internal Server Error",
      details: {
        code: "SERVER_ERROR",
        message: "Failed to fetch workspace members"
      }
    });
  }
});

/**
 * @route POST /workspaces/{workspaceId}/members
 * @desc Add a member to workspace by email
 */
router.post('/:workspaceId/members', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;

    // Validate request body
    const validationResult = addMemberSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Bad Request",
        details: {
          code: "VALIDATION_ERROR",
          message: "Invalid member data",
          errors: validationResult.error.errors,
        },
      });
    }

    const { email } = validationResult.data;

    // Check if requester is a member of the workspace
    const requesterMembership = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.workspaceId, parseInt(workspaceId)),
          eq(userWorkspaces.userId, req.user!.userId)
        )
      )
      .limit(1);

    if (!requesterMembership.length) {
      return res.status(403).json({
        error: "Forbidden",
        details: {
          code: "NOT_WORKSPACE_MEMBER",
          message: "You are not a member of this workspace"
        }
      });
    }

    // Find user by email
    const [userToAdd] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!userToAdd) {
      return res.status(404).json({
        error: "Not Found",
        details: {
          code: "EMAIL_NOT_FOUND",
          message: "No user found with this email address"
        }
      });
    }

    // Check if user is already a member
    const existingMembership = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.workspaceId, parseInt(workspaceId)),
          eq(userWorkspaces.userId, userToAdd.userId)
        )
      )
      .limit(1);

    if (existingMembership.length) {
      return res.status(400).json({
        error: "Bad Request",
        details: {
          code: "ALREADY_MEMBER",
          message: "User is already a member of this workspace"
        }
      });
    }

    // Add user to workspace
    await db.insert(userWorkspaces).values({
      userId: userToAdd.userId,
      workspaceId: parseInt(workspaceId),
      role: "MEMBER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      message: "Member added successfully",
      member: {
        userId: userToAdd.userId,
        email: userToAdd.email,
        displayName: userToAdd.displayName,
      }
    });
  } catch (error) {
    console.error('Error adding workspace member:', error);
    res.status(500).json({
      error: "Internal Server Error",
      details: {
        code: "SERVER_ERROR",
        message: "Failed to add member to workspace"
      }
    });
  }
});

export { router as workspaceRouter };