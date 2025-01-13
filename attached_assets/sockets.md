Objective:

Set up the backend infrastructure for WebSockets and event broadcasting in the project. Focus on implementing real-time updates for the channel list when a new channel is created. Utilize the technical instructions from backend_plan.md and refer to openapi.json for understanding backend routes and event triggers. The actual database manipulation (inserts, updates, deletes, etc..) is already implemented by the server routes. Your task is to add a websocket infrastructre on top of this. That means you should modify the endpoints in server/routes to broadcast the appropriate messages. Any new files you need for setting up this infrastructure should go in a new /server/websocket directory. You should not need to add any new files anywhere else though you will need to edit the routes files as described. 

---

Instructions:

1. Backend Infrastructure Setup:
   - Establish the WebSocket server and configure it to handle real-time communication.
   - Implement event broadcasting mechanisms to send messages to all connected clients within a workspace.

2. Implement Feature: Channel Creation Broadcast
   - Trigger Condition:
     - When a user creates a new channel in a workspace.
   - Actions:
     - Broadcast a message to all users in the workspace notifying them of the new channel.
     - Ensure that the channel list updates in real-time for all connected clients.
   - Technical Details:
     - Follow guidelines from the Real-Time WebSockets and Message Broadcasting sections in backend_plan.md.
     - Use appropriate WebSocket events to handle the creation and broadcasting process.
     - Ensure secure and efficient handling of WebSocket connections.

3. Leverage API Specifications:
   - Refer to openapi.json to understand existing backend routes and endpoints.
   - Identify where WebSocket events need to be integrated within the current API structure.
   - Ensure compatibility with existing routes and adherence to API standards.

---

Future Features (For Reference):

While the current focus is on the channel creation broadcast, be aware of future requirements for setting up a scalable and extensible WebSocket infrastructure:

1. New Message Broadcast:
   - Broadcast new messages to all users in a channel.
   - Handle message display differently based on user state and message type (reply or top-level).

2. User Status Change Broadcast:
   - Broadcast status changes when a user updates their availability.
   - Update the status icons in real-time across the app wherever the user appears.

3. Message Reaction Broadcast:
   - Broadcast reactions to messages within a workspace.
   - Update reaction counts and displays in real-time for all users.

---

Notes:

- Current Limitation:
  - The channel list is the only frontend component currently implemented. Focus solely on enabling real-time updates for this component.
  
- Best Practices:
  - Ensure that the WebSocket implementation is secure and handles reconnections gracefully.
  - Write clean, maintainable code with comments explaining complex sections.
  - Prepare the infrastructure to easily incorporate additional features in the future.

---

Summary:

Your task is to establish the backend WebSocket infrastructure and implement real-time broadcasting when a new channel is created. Use backend_plan.md for technical guidance and openapi.json to align with existing backend routes. While only the channel list feature is to be implemented now, design your solution with future expansions in mind.