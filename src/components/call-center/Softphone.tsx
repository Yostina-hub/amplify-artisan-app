import { useState, useEffect, useRef } from "react";
import JsSIP from "jssip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  PhoneForwarded,
  Pause,
  Play,
  Settings
} from "lucide-react";

interface SoftphoneProps {
  sipConfig: {
    sipServer: string;
    sipUser: string;
    sipPassword: string;
    sipDomain: string;
  } | null;
  onCallStart?: (phoneNumber: string) => void;
  onCallEnd?: (duration: number) => void;
  onOpenSettings: () => void;
}

export default function Softphone({ sipConfig, onCallStart, onCallEnd, onOpenSettings }: SoftphoneProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "ringing" | "active" | "held">("idle");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "registered">("disconnected");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  
  const uaRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (sipConfig) {
      initializeSIP();
    }
    return () => {
      if (uaRef.current) {
        uaRef.current.stop();
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [sipConfig]);

  const initializeSIP = () => {
    if (!sipConfig) return;

    try {
      const socket = new JsSIP.WebSocketInterface(`wss://${sipConfig.sipServer}`);
      
      const configuration = {
        sockets: [socket],
        uri: `sip:${sipConfig.sipUser}@${sipConfig.sipDomain}`,
        password: sipConfig.sipPassword,
        display_name: sipConfig.sipUser,
        register: true,
        session_timers: false,
      };

      const ua = new JsSIP.UA(configuration);

      ua.on("connecting", () => {
        setConnectionStatus("connecting");
        toast.info("Connecting to SIP server...");
      });

      ua.on("connected", () => {
        setConnectionStatus("connected");
        toast.success("Connected to SIP server");
      });

      ua.on("disconnected", () => {
        setConnectionStatus("disconnected");
        toast.error("Disconnected from SIP server");
      });

      ua.on("registered", () => {
        setConnectionStatus("registered");
        toast.success("Registered successfully");
      });

      ua.on("registrationFailed", (e: any) => {
        setConnectionStatus("disconnected");
        toast.error(`Registration failed: ${e.cause}`);
      });

      ua.on("newRTCSession", (data: any) => {
        const session = data.session;
        
        if (session.direction === "incoming") {
          sessionRef.current = session;
          setCallStatus("ringing");
          toast.info(`Incoming call from ${session.remote_identity.uri.user}`);
          setupSessionHandlers(session);
        }
      });

      ua.start();
      uaRef.current = ua;
    } catch (error: any) {
      toast.error(`Failed to initialize SIP: ${error.message}`);
      console.error("SIP initialization error:", error);
    }
  };

  const setupSessionHandlers = (session: any) => {
    session.on("peerconnection", (e: any) => {
      const peerconnection = e.peerconnection;
      
      peerconnection.ontrack = (event: RTCTrackEvent) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play();
        }
      };
    });

    session.on("accepted", () => {
      setCallStatus("active");
      startCallTimer();
      onCallStart?.(phoneNumber || session.remote_identity.uri.user);
    });

    session.on("confirmed", () => {
      setCallStatus("active");
    });

    session.on("ended", () => {
      endCall();
    });

    session.on("failed", (e: any) => {
      toast.error(`Call failed: ${e.cause}`);
      endCall();
    });
  };

  const makeCall = async () => {
    if (!uaRef.current || connectionStatus !== "registered") {
      toast.error("Not connected to SIP server");
      return;
    }

    if (!phoneNumber) {
      toast.error("Please enter a phone number");
      return;
    }

    try {
      const eventHandlers = {
        progress: () => {
          setCallStatus("ringing");
        },
        failed: (e: any) => {
          toast.error(`Call failed: ${e.cause}`);
          endCall();
        },
        ended: () => {
          endCall();
        },
        confirmed: () => {
          setCallStatus("active");
        },
      };

      const options = {
        eventHandlers,
        mediaConstraints: { audio: true, video: false },
      };

      const session = uaRef.current.call(`sip:${phoneNumber}@${sipConfig?.sipDomain}`, options);
      sessionRef.current = session;
      setCallStatus("connecting");
      setupSessionHandlers(session);
    } catch (error: any) {
      toast.error(`Failed to make call: ${error.message}`);
      console.error("Call error:", error);
    }
  };

  const answerCall = () => {
    if (sessionRef.current) {
      const options = {
        mediaConstraints: { audio: true, video: false },
      };
      sessionRef.current.answer(options);
    }
  };

  const hangupCall = () => {
    if (sessionRef.current) {
      sessionRef.current.terminate();
    }
    endCall();
  };

  const endCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    onCallEnd?.(callDuration);
    
    setCallStatus("idle");
    setCallDuration(0);
    setIsMuted(false);
    sessionRef.current = null;
  };

  const toggleMute = () => {
    if (sessionRef.current) {
      if (isMuted) {
        sessionRef.current.unmute();
      } else {
        sessionRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerMuted;
      setIsSpeakerMuted(!isSpeakerMuted);
    }
  };

  const toggleHold = () => {
    if (sessionRef.current) {
      if (callStatus === "held") {
        sessionRef.current.unhold();
        setCallStatus("active");
      } else {
        sessionRef.current.hold();
        setCallStatus("held");
      }
    }
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0 
      ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    const statusMap = {
      disconnected: { variant: "destructive" as const, text: "Disconnected" },
      connecting: { variant: "secondary" as const, text: "Connecting..." },
      connected: { variant: "default" as const, text: "Connected" },
      registered: { variant: "default" as const, text: "Ready" },
    };
    const status = statusMap[connectionStatus];
    return <Badge variant={status.variant}>{status.text}</Badge>;
  };

  const dialpadButtons = [
    "1", "2", "3",
    "4", "5", "6", 
    "7", "8", "9",
    "*", "0", "#"
  ];

  const handleDialpad = (digit: string) => {
    if (callStatus === "active" && sessionRef.current) {
      sessionRef.current.sendDTMF(digit);
    }
    setPhoneNumber(prev => prev + digit);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Softphone
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button variant="ghost" size="icon" onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio ref={remoteAudioRef} autoPlay />
        
        {/* Phone Number Input */}
        <div className="space-y-2">
          <Input
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={callStatus !== "idle"}
            className="text-center text-lg"
          />
        </div>

        {/* Dialpad */}
        {(callStatus === "idle" || callStatus === "active") && (
          <div className="grid grid-cols-3 gap-2">
            {dialpadButtons.map((digit) => (
              <Button
                key={digit}
                variant="outline"
                onClick={() => handleDialpad(digit)}
                className="h-12 text-lg font-semibold"
              >
                {digit}
              </Button>
            ))}
          </div>
        )}

        {/* Call Status */}
        {callStatus !== "idle" && (
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {callStatus === "connecting" && "Connecting..."}
              {callStatus === "ringing" && "Ringing..."}
              {callStatus === "active" && `Active - ${formatDuration(callDuration)}`}
              {callStatus === "held" && `On Hold - ${formatDuration(callDuration)}`}
            </Badge>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex gap-2 justify-center">
          {callStatus === "idle" && (
            <Button 
              onClick={makeCall} 
              disabled={!sipConfig || connectionStatus !== "registered"}
              className="w-full"
              size="lg"
            >
              <Phone className="mr-2 h-5 w-5" />
              Call
            </Button>
          )}

          {callStatus === "ringing" && (
            <>
              <Button onClick={answerCall} className="flex-1" variant="default">
                <Phone className="mr-2 h-4 w-4" />
                Answer
              </Button>
              <Button onClick={hangupCall} className="flex-1" variant="destructive">
                <PhoneOff className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </>
          )}

          {(callStatus === "connecting" || callStatus === "active" || callStatus === "held") && (
            <>
              <Button 
                onClick={toggleMute} 
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button 
                onClick={toggleSpeaker} 
                variant={isSpeakerMuted ? "destructive" : "outline"}
                size="icon"
              >
                {isSpeakerMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <Button 
                onClick={toggleHold} 
                variant={callStatus === "held" ? "default" : "outline"}
                size="icon"
              >
                {callStatus === "held" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>

              <Button onClick={hangupCall} variant="destructive" className="flex-1">
                <PhoneOff className="mr-2 h-4 w-4" />
                Hang Up
              </Button>
            </>
          )}
        </div>

        {!sipConfig && (
          <div className="text-center text-sm text-muted-foreground">
            Configure SIP settings to start making calls
          </div>
        )}
      </CardContent>
    </Card>
  );
}
