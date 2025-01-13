import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchChannels, createChannel, setCurrentChannel, toggleShowArchived } from '@/store/channelSlice';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Archive, Loader2, Lock, Hash } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

const createChannelSchema = z.object({
  name: z.string().min(1, 'Channel name is required').max(50, 'Name is too long'),
  description: z.string().max(255, 'Description is too long').optional(),
  channelType: z.enum(['PUBLIC', 'PRIVATE']),
});

type CreateChannelForm = z.infer<typeof createChannelSchema>;

export function ChannelList() {
  const dispatch = useAppDispatch();
  const { channels, currentChannel, loading, error, showArchived } = useAppSelector((state) => state.channel);
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateChannelForm>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: '',
      description: '',
      channelType: 'PUBLIC',
    },
  });

  useEffect(() => {
    if (currentWorkspace?.workspaceId) {
      const loadChannels = async () => {
        try {
          await dispatch(fetchChannels({ 
            workspaceId: currentWorkspace.workspaceId,
            showArchived,
          })).unwrap();
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load channels",
            variant: "destructive",
          });
        }
      };
      loadChannels();
    }
  }, [dispatch, currentWorkspace?.workspaceId, showArchived, toast]);

  const handleCreateChannel = async (data: CreateChannelForm) => {
    if (!currentWorkspace?.workspaceId) return;

    try {
      await dispatch(createChannel({
        workspaceId: currentWorkspace.workspaceId,
        channel: {
          ...data,
          archived: false,
        }
      })).unwrap();

      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Channel created successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create channel",
        variant: "destructive",
      });
    }
  };

  const handleSelectChannel = (channel: typeof channels[number]) => {
    dispatch(setCurrentChannel(channel));
  };

  const handleToggleArchived = () => {
    dispatch(toggleShowArchived());
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'PRIVATE':
        return <Lock className="h-4 w-4 mr-2" />;
      case 'PUBLIC':
        return <Hash className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Select a workspace to view channels</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Channels</h2>
        <div className="flex items-center justify-between px-4 mb-2">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="justify-start"
            variant="ghost"
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Channel
          </Button>
          <div className="flex items-center space-x-2">
            <Switch
              checked={showArchived}
              onCheckedChange={handleToggleArchived}
              id="show-archived"
            />
            <label
              htmlFor="show-archived"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Show Archived
            </label>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-16rem)]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="px-4 py-2 text-destructive">
            {error}
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">No channels found</p>
            <Button onClick={() => setCreateDialogOpen(true)} variant="outline" size="sm">
              Create your first channel
            </Button>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {channels.map((channel) => (
              <Button
                key={`channel-${channel.channelId}`}
                onClick={() => handleSelectChannel(channel)}
                variant={currentChannel?.channelId === channel.channelId ? "secondary" : "ghost"}
                className="w-full justify-start font-normal"
              >
                <span className="flex items-center">
                  {getChannelIcon(channel.channelType)}
                  {channel.name}
                </span>
                {channel.archived && (
                  <Archive className="ml-2 h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateChannel)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter channel name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter channel description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChannelList;