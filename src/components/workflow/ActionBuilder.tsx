import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Zap, Mail, Database, Webhook, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ActionBuilderProps {
  actions: any[];
  onUpdate: (actions: any[]) => void;
}

const ACTION_TYPES = [
  {
    id: 'email',
    name: 'Send Email',
    icon: Mail,
    color: 'hsl(220, 70%, 50%)',
    fields: ['to', 'subject', 'body'],
  },
  {
    id: 'webhook',
    name: 'Call Webhook',
    icon: Webhook,
    color: 'hsl(160, 70%, 45%)',
    fields: ['url', 'method', 'payload'],
  },
  {
    id: 'zapier',
    name: 'Trigger Zapier',
    icon: Zap,
    color: 'hsl(25, 95%, 53%)',
    fields: ['webhook_url', 'payload'],
  },
  {
    id: 'database',
    name: 'Database Action',
    icon: Database,
    color: 'hsl(280, 70%, 50%)',
    fields: ['table', 'operation', 'data'],
  },
  {
    id: 'notification',
    name: 'Send Notification',
    icon: MessageSquare,
    color: 'hsl(340, 70%, 50%)',
    fields: ['title', 'message', 'recipients'],
  },
];

export function ActionBuilder({ actions, onUpdate }: ActionBuilderProps) {
  const [selectedType, setSelectedType] = useState<string>('');

  const addAction = () => {
    const actionType = ACTION_TYPES.find(t => t.id === selectedType);
    if (!actionType) return;

    const newAction = {
      id: crypto.randomUUID(),
      type: selectedType,
      name: actionType.name,
      config: {},
      color: actionType.color,
    };

    onUpdate([...actions, newAction]);
    setSelectedType('');
  };

  const updateAction = (id: string, updates: any) => {
    onUpdate(
      actions.map(action =>
        action.id === id ? { ...action, ...updates } : action
      )
    );
  };

  const removeAction = (id: string) => {
    onUpdate(actions.filter(action => action.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Actions</CardTitle>
        <CardDescription>
          Define what happens when this workflow is triggered
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {ACTION_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={selectedType === type.id ? 'default' : 'outline'}
                className="h-auto p-3 flex-col gap-2"
                onClick={() => setSelectedType(type.id)}
              >
                <Icon className="h-5 w-5" style={{ color: selectedType === type.id ? '' : type.color }} />
                <span className="text-xs">{type.name}</span>
              </Button>
            );
          })}
        </div>

        {selectedType && (
          <Button onClick={addAction} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add {ACTION_TYPES.find(t => t.id === selectedType)?.name}
          </Button>
        )}

        {/* Actions List */}
        {actions.length > 0 ? (
          <div className="space-y-3 mt-4">
            {actions.map((action, index) => {
              const actionType = ACTION_TYPES.find(t => t.id === action.type);
              const Icon = actionType?.icon || Zap;

              return (
                <Card key={action.id} style={{ borderLeftColor: action.color, borderLeftWidth: '4px' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <Icon className="h-4 w-4" style={{ color: action.color }} />
                        <span className="font-medium">{action.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(action.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <Tabs defaultValue="config" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="config">Configuration</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>

                      <TabsContent value="config" className="space-y-3 mt-3">
                        {action.type === 'email' && (
                          <>
                            <div className="space-y-2">
                              <Label>To</Label>
                              <Input
                                placeholder="recipient@example.com"
                                value={action.config.to || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, to: e.target.value },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Subject</Label>
                              <Input
                                placeholder="Email subject"
                                value={action.config.subject || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, subject: e.target.value },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Body</Label>
                              <Textarea
                                placeholder="Email body content"
                                value={action.config.body || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, body: e.target.value },
                                  })
                                }
                                rows={4}
                              />
                            </div>
                          </>
                        )}

                        {action.type === 'zapier' && (
                          <>
                            <div className="space-y-2">
                              <Label>Zapier Webhook URL</Label>
                              <Input
                                placeholder="https://hooks.zapier.com/..."
                                value={action.config.webhook_url || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, webhook_url: e.target.value },
                                  })
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Get this from your Zapier Webhook trigger
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Payload (JSON)</Label>
                              <Textarea
                                placeholder='{"key": "value"}'
                                value={action.config.payload || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, payload: e.target.value },
                                  })
                                }
                                rows={4}
                                className="font-mono text-xs"
                              />
                            </div>
                          </>
                        )}

                        {action.type === 'webhook' && (
                          <>
                            <div className="space-y-2">
                              <Label>Webhook URL</Label>
                              <Input
                                placeholder="https://api.example.com/webhook"
                                value={action.config.url || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, url: e.target.value },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Method</Label>
                              <Select
                                value={action.config.method || 'POST'}
                                onValueChange={(value) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, method: value },
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GET">GET</SelectItem>
                                  <SelectItem value="POST">POST</SelectItem>
                                  <SelectItem value="PUT">PUT</SelectItem>
                                  <SelectItem value="DELETE">DELETE</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Payload (JSON)</Label>
                              <Textarea
                                placeholder='{"key": "value"}'
                                value={action.config.payload || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, payload: e.target.value },
                                  })
                                }
                                rows={4}
                                className="font-mono text-xs"
                              />
                            </div>
                          </>
                        )}

                        {action.type === 'database' && (
                          <>
                            <div className="space-y-2">
                              <Label>Table</Label>
                              <Input
                                placeholder="table_name"
                                value={action.config.table || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, table: e.target.value },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Operation</Label>
                              <Select
                                value={action.config.operation || 'insert'}
                                onValueChange={(value) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, operation: value },
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="insert">Insert</SelectItem>
                                  <SelectItem value="update">Update</SelectItem>
                                  <SelectItem value="delete">Delete</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Data (JSON)</Label>
                              <Textarea
                                placeholder='{"column": "value"}'
                                value={action.config.data || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, data: e.target.value },
                                  })
                                }
                                rows={4}
                                className="font-mono text-xs"
                              />
                            </div>
                          </>
                        )}

                        {action.type === 'notification' && (
                          <>
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                placeholder="Notification title"
                                value={action.config.title || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, title: e.target.value },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Message</Label>
                              <Textarea
                                placeholder="Notification message"
                                value={action.config.message || ''}
                                onChange={(e) =>
                                  updateAction(action.id, {
                                    config: { ...action.config, message: e.target.value },
                                  })
                                }
                                rows={3}
                              />
                            </div>
                          </>
                        )}
                      </TabsContent>

                      <TabsContent value="advanced" className="space-y-3 mt-3">
                        <div className="space-y-2">
                          <Label>Delay (seconds)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={action.config.delay || 0}
                            onChange={(e) =>
                              updateAction(action.id, {
                                config: { ...action.config, delay: parseInt(e.target.value) || 0 },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Retry Count</Label>
                          <Input
                            type="number"
                            placeholder="3"
                            value={action.config.retry_count || 3}
                            onChange={(e) =>
                              updateAction(action.id, {
                                config: { ...action.config, retry_count: parseInt(e.target.value) || 0 },
                              })
                            }
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No actions yet. Add an action to define what happens.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
