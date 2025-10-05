import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

interface SipConfig {
  sipServer: string;
  sipUser: string;
  sipPassword: string;
  sipDomain: string;
}

interface SipSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: SipConfig) => void;
  initialConfig?: SipConfig | null;
}

export default function SipSettings({ open, onOpenChange, onSave, initialConfig }: SipSettingsProps) {
  const [config, setConfig] = useState<SipConfig>({
    sipServer: "",
    sipUser: "",
    sipPassword: "",
    sipDomain: "",
  });

  const [freepbxConfig, setFreepbxConfig] = useState({
    serverUrl: "",
    extension: "",
    password: "",
    domain: "",
  });

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleSave = (type: "custom" | "freepbx") => {
    const configToSave = type === "custom" ? config : {
      sipServer: freepbxConfig.serverUrl,
      sipUser: freepbxConfig.extension,
      sipPassword: freepbxConfig.password,
      sipDomain: freepbxConfig.domain,
    };

    if (!configToSave.sipServer || !configToSave.sipUser || !configToSave.sipPassword || !configToSave.sipDomain) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Save to localStorage
    localStorage.setItem("sip-config", JSON.stringify(configToSave));
    
    onSave(configToSave);
    toast.success("SIP configuration saved successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            SIP Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your SIP credentials to enable softphone functionality
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom SIP</TabsTrigger>
            <TabsTrigger value="freepbx">FreePBX Server</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="sipServer">SIP Server (WebSocket URL)</Label>
              <Input
                id="sipServer"
                placeholder="sip.example.com:8089"
                value={config.sipServer}
                onChange={(e) => setConfig({ ...config, sipServer: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Enter WebSocket server address (e.g., sip.provider.com:8089)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sipDomain">SIP Domain</Label>
              <Input
                id="sipDomain"
                placeholder="example.com"
                value={config.sipDomain}
                onChange={(e) => setConfig({ ...config, sipDomain: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sipUser">SIP Username/Extension</Label>
              <Input
                id="sipUser"
                placeholder="1001"
                value={config.sipUser}
                onChange={(e) => setConfig({ ...config, sipUser: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sipPassword">SIP Password</Label>
              <Input
                id="sipPassword"
                type="password"
                placeholder="••••••••"
                value={config.sipPassword}
                onChange={(e) => setConfig({ ...config, sipPassword: e.target.value })}
              />
            </div>

            <Button onClick={() => handleSave("custom")} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </Button>
          </TabsContent>

          <TabsContent value="freepbx" className="space-y-4 mt-4">
            <div className="bg-muted p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-2">FreePBX Configuration</h4>
              <p className="text-sm text-muted-foreground">
                Connect directly to your FreePBX server. Make sure WebRTC is enabled in your FreePBX settings.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="freepbxUrl">FreePBX Server URL</Label>
              <Input
                id="freepbxUrl"
                placeholder="pbx.yourcompany.com:8089"
                value={freepbxConfig.serverUrl}
                onChange={(e) => setFreepbxConfig({ ...freepbxConfig, serverUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Enter your FreePBX WebSocket server address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="freepbxDomain">Domain</Label>
              <Input
                id="freepbxDomain"
                placeholder="pbx.yourcompany.com"
                value={freepbxConfig.domain}
                onChange={(e) => setFreepbxConfig({ ...freepbxConfig, domain: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="freepbxExt">Extension Number</Label>
              <Input
                id="freepbxExt"
                placeholder="1001"
                value={freepbxConfig.extension}
                onChange={(e) => setFreepbxConfig({ ...freepbxConfig, extension: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="freepbxPass">Extension Password</Label>
              <Input
                id="freepbxPass"
                type="password"
                placeholder="••••••••"
                value={freepbxConfig.password}
                onChange={(e) => setFreepbxConfig({ ...freepbxConfig, password: e.target.value })}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">FreePBX Setup Requirements:</h4>
              <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                <li>Enable WebRTC in FreePBX settings</li>
                <li>Configure WebSocket transport (usually port 8089)</li>
                <li>Ensure SSL certificate is valid for WSS</li>
                <li>Create a SIP extension for this user</li>
              </ul>
            </div>

            <Button onClick={() => handleSave("freepbx")} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Connect to FreePBX
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
