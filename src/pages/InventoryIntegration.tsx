import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, AlertTriangle, CheckCircle, TrendingUp, Warehouse, RefreshCw, Plus, Download } from "lucide-react";

const InventoryIntegration = () => {
  const [autoSync, setAutoSync] = useState(true);

  const inventory = [
    {
      id: 1,
      sku: "CRM-ENT-001",
      product: "Enterprise CRM License",
      inStock: 150,
      reserved: 45,
      available: 105,
      reorderPoint: 50,
      status: "healthy"
    },
    {
      id: 2,
      sku: "CRM-PRO-002",
      product: "Professional CRM License",
      inStock: 80,
      reserved: 65,
      available: 15,
      reorderPoint: 30,
      status: "low"
    },
    {
      id: 3,
      sku: "ADD-API-003",
      product: "API Integration Add-on",
      inStock: 200,
      reserved: 120,
      available: 80,
      reorderPoint: 100,
      status: "healthy"
    },
    {
      id: 4,
      sku: "ADD-SUP-004",
      product: "Premium Support Package",
      inStock: 25,
      reserved: 22,
      available: 3,
      reorderPoint: 20,
      status: "critical"
    }
  ];

  const recentOrders = [
    {
      id: "ORD-1245",
      customer: "Acme Corp",
      items: "CRM-ENT-001 (10), ADD-API-003 (5)",
      status: "reserved",
      date: "2024-12-20"
    },
    {
      id: "ORD-1246",
      customer: "TechStart Inc",
      items: "CRM-PRO-002 (5)",
      status: "shipped",
      date: "2024-12-19"
    },
    {
      id: "ORD-1247",
      customer: "Global Solutions",
      items: "CRM-ENT-001 (15), ADD-SUP-004 (3)",
      status: "reserved",
      date: "2024-12-18"
    }
  ];

  const integrations = [
    {
      name: "QuickBooks",
      status: "connected",
      lastSync: "5 minutes ago",
      autoSync: true
    },
    {
      name: "NetSuite",
      status: "connected",
      lastSync: "1 hour ago",
      autoSync: true
    },
    {
      name: "SAP",
      status: "disconnected",
      lastSync: "Never",
      autoSync: false
    },
    {
      name: "Shopify",
      status: "connected",
      lastSync: "10 minutes ago",
      autoSync: true
    }
  ];

  const alerts = [
    {
      severity: "critical",
      product: "Premium Support Package",
      message: "Only 3 units available. Below critical threshold.",
      action: "Reorder now"
    },
    {
      severity: "warning",
      product: "Professional CRM License",
      message: "Stock running low. 15 units remaining.",
      action: "Monitor closely"
    },
    {
      severity: "info",
      product: "Enterprise CRM License",
      message: "Large order pending. 45 units reserved.",
      action: "Review order"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Healthy</Badge>;
      case "low":
        return <Badge className="bg-orange-500">Low Stock</Badge>;
      case "critical":
        return <Badge className="bg-red-500">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getConnectionBadge = (status: string) => {
    return status === "connected" ? (
      <Badge className="bg-green-500">
        <CheckCircle className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-500">
        Disconnected
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Integration</h1>
          <p className="text-muted-foreground">Real-time inventory tracking synced with your CRM deals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total SKUs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">247</div>
            <p className="text-sm text-muted-foreground">Across all products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12.5K</div>
            <p className="text-sm text-muted-foreground">Total units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-sm text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Fulfillment Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">94%</div>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList>
          <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Inventory Levels</CardTitle>
                  <CardDescription>Real-time stock availability</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Auto-sync</Label>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">In Stock</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Reorder Point</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell className="text-right">{item.inStock}</TableCell>
                      <TableCell className="text-right">{item.reserved}</TableCell>
                      <TableCell className="text-right font-semibold">{item.available}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.reorderPoint}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Adjust</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Orders with inventory reservations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{order.id}</h4>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="text-muted-foreground">Customer: </span>
                              <span className="font-medium">{order.customer}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Items: </span>
                              <span>{order.items}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{order.date}</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Connected Systems</CardTitle>
                  <CardDescription>Inventory management integrations</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{integration.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Last sync: {integration.lastSync}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getConnectionBadge(integration.status)}
                          {integration.status === "connected" && (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Auto-sync</Label>
                              <Switch defaultChecked={integration.autoSync} />
                            </div>
                          )}
                          <Button variant="outline" size="sm">
                            {integration.status === "connected" ? "Configure" : "Connect"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Sync Frequency</Label>
                <Select defaultValue="5min">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="5min">Every 5 minutes</SelectItem>
                    <SelectItem value="15min">Every 15 minutes</SelectItem>
                    <SelectItem value="1hour">Every hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input type="number" defaultValue={20} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Email notifications on low stock</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Block deals when out of stock</Label>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>Items requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {alerts.map((alert, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          {alert.severity === "critical" && (
                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          {alert.severity === "warning" && (
                            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                          )}
                          {alert.severity === "info" && (
                            <Package className="h-5 w-5 text-blue-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{alert.product}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                            <Button
                              size="sm"
                              variant={alert.severity === "critical" ? "default" : "outline"}
                            >
                              {alert.action}
                            </Button>
                          </div>
                          <Badge
                            className={
                              alert.severity === "critical"
                                ? "bg-red-500"
                                : alert.severity === "warning"
                                ? "bg-orange-500"
                                : "bg-blue-500"
                            }
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryIntegration;
