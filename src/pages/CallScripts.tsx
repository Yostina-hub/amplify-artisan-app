import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Copy,
  Phone,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Play,
  Clock
} from "lucide-react";
import { PageHelp } from "@/components/PageHelp";

interface CallScript {
  id: string;
  name: string;
  type: string;
  stage: string;
  objective: string;
  script: CallScriptSection[];
  objectionHandling: Objection[];
  tips: string[];
  usageCount: number;
}

interface CallScriptSection {
  title: string;
  content: string;
  type: "opening" | "discovery" | "presentation" | "objection" | "closing";
  talkTrack: string[];
}

interface Objection {
  objection: string;
  response: string;
  followUp?: string;
}

const CALL_SCRIPT_TEMPLATES: CallScript[] = [
  {
    id: "1",
    name: "Cold Call - Discovery",
    type: "outbound",
    stage: "prospecting",
    objective: "Book a discovery meeting with decision maker",
    usageCount: 45,
    script: [
      {
        title: "Opening (15 seconds)",
        type: "opening",
        content: "Hi {{first_name}}, this is {{your_name}} from {{company}}. How are you today?",
        talkTrack: [
          "Brief pause for response",
          "Keep tone friendly but professional",
          "Use their first name to build rapport"
        ]
      },
      {
        title: "Permission & Purpose",
        type: "opening",
        content: "I know you're busy, so I'll be brief. I'm calling because we work with {{industry}} companies like {{similar_company}} to help them {{value_prop}}. Do you have 2 minutes to see if this might be relevant for {{company}}?",
        talkTrack: [
          "Ask permission to continue",
          "Name-drop similar company",
          "State clear value proposition",
          "Set time expectation (2 minutes)"
        ]
      },
      {
        title: "Discovery Questions",
        type: "discovery",
        content: "Tell me, how are you currently handling {{pain_point}}?",
        talkTrack: [
          "What challenges are you seeing with {{process}}?",
          "How much time does your team spend on {{task}}?",
          "What would it mean for your business if you could {{outcome}}?",
          "Who else is involved in decisions around {{area}}?"
        ]
      },
      {
        title: "Bridge to Meeting",
        type: "closing",
        content: "Based on what you've shared, I think there could be a good fit. Rather than trying to explain everything over the phone, would it make sense to schedule a brief 20-minute call where I can show you exactly how {{similar_company}} achieved {{result}}?",
        talkTrack: [
          "Tie back to their pain points",
          "Use success story as proof",
          "Suggest specific time length",
          "Give them control of calendar"
        ]
      }
    ],
    objectionHandling: [
      {
        objection: "I'm not interested",
        response: "I completely understand. Can I ask - is it that the timing isn't right, or is it that you're not seeing {{pain_point}} as a priority right now?",
        followUp: "If it's timing, when would be a better time to reconnect? If it's priority, what are your top 3 priorities this quarter?"
      },
      {
        objection: "Send me some information",
        response: "I'd be happy to. Rather than sending generic information that might not be relevant, can I ask you 2-3 quick questions so I can send you exactly what matters to {{company}}?",
        followUp: "Then transition back to discovery questions"
      },
      {
        objection: "We already have a solution",
        response: "That's great that you have something in place. Can I ask - what made you choose that solution? And more importantly, how well is it working for {{specific_use_case}}?",
        followUp: "Listen for gaps or frustrations with current solution"
      },
      {
        objection: "No budget",
        response: "I appreciate your transparency. Most of our clients didn't have budget allocated when we first spoke. Can I ask - if you could solve {{pain_point}} and it paid for itself in {{timeframe}}, would that change the conversation?",
        followUp: "Focus on ROI and value, not just cost"
      }
    ],
    tips: [
      "Smile while talking - it comes through in your voice",
      "Stand up during calls for more energy",
      "Use prospect's company name often",
      "Listen more than you talk (60/40 rule)",
      "Take notes during the call",
      "Always end with a clear next step"
    ]
  },
  {
    id: "2",
    name: "Discovery Call - Qualification",
    type: "scheduled",
    stage: "qualification",
    objective: "Qualify opportunity and identify decision makers",
    usageCount: 38,
    script: [
      {
        title: "Opening & Agenda",
        type: "opening",
        content: "Thanks for taking the time today, {{first_name}}. I've blocked out 30 minutes. My goal is to learn about {{company}}'s situation, share what we do, and see if there's a fit. Sound good?",
        talkTrack: [
          "Thank them for their time",
          "Set clear agenda and timeline",
          "Get agreement before proceeding",
          "Make it collaborative, not a pitch"
        ]
      },
      {
        title: "Background Questions (BANT)",
        type: "discovery",
        content: "Let's start with some context. Can you walk me through your current process for {{area}}?",
        talkTrack: [
          "BUDGET: What's your annual spend on {{category}}?",
          "AUTHORITY: Who else would need to be involved in this decision?",
          "NEED: What's driving you to look for a solution now?",
          "TIMELINE: What's your timeline for making a decision?"
        ]
      },
      {
        title: "Pain & Impact",
        type: "discovery",
        content: "You mentioned {{pain_point}}. Can you help me understand the impact that has on your business?",
        talkTrack: [
          "What does that cost you in terms of time/money?",
          "How does this affect your team's productivity?",
          "What happens if you don't solve this in the next 6 months?",
          "What would success look like for you?"
        ]
      },
      {
        title: "Solution Overview",
        type: "presentation",
        content: "Based on what you've shared, here's how we typically help companies in your situation...",
        talkTrack: [
          "Keep it specific to their pain points",
          "Use relevant customer success story",
          "Focus on outcomes, not features",
          "Pause for questions throughout"
        ]
      },
      {
        title: "Next Steps",
        type: "closing",
        content: "Based on our conversation, I think there's definitely something here. What I'd like to do next is {{next_step}}. Does that work for you?",
        talkTrack: [
          "Be specific about next steps",
          "Get calendar commitment before hanging up",
          "Identify who else needs to be included",
          "Send calendar invite immediately after call"
        ]
      }
    ],
    objectionHandling: [
      {
        objection: "Your price is too high",
        response: "I appreciate you being upfront about price. Can I ask - too high compared to what? Are you comparing to {{competitor}} or to the cost of not solving this problem?",
        followUp: "Build value case based on their specific pain points and ROI"
      },
      {
        objection: "We need to think about it",
        response: "Of course, I want you to feel confident in any decision. Can I ask - what specifically do you need to think about? Is it budget, timing, or something about the solution itself?",
        followUp: "Address the real objection and create urgency"
      },
      {
        objection: "Can you give us a discount?",
        response: "Let me understand - is price the only thing standing between us moving forward? If I could work with my manager on pricing, are you ready to move forward today?",
        followUp: "Get commitment first, then discuss options"
      }
    ],
    tips: [
      "Let them talk 70% of the time",
      "Ask follow-up questions to everything",
      "Take detailed notes for proposal",
      "Confirm pain points back to them",
      "Get specific on metrics and outcomes",
      "Always schedule next meeting before hanging up"
    ]
  },
  {
    id: "3",
    name: "Demo/Presentation Call",
    type: "scheduled",
    stage: "presentation",
    objective: "Demonstrate value and move to proposal stage",
    usageCount: 52,
    script: [
      {
        title: "Opening & Recap",
        type: "opening",
        content: "Thanks everyone for joining. Before we dive in, let me quickly recap what we discussed last time. You mentioned {{pain_point_1}} and {{pain_point_2}}. Is that still accurate, or has anything changed?",
        talkTrack: [
          "Acknowledge all attendees",
          "Recap previous conversation",
          "Confirm pain points are still valid",
          "Ask if anything has changed"
        ]
      },
      {
        title: "Demo Framework",
        type: "presentation",
        content: "Great. Today I'm going to show you three things: 1) How to solve {{pain_1}}, 2) How to achieve {{goal}}, and 3) What results to expect. I'll keep it to 20 minutes and then we'll open it up for questions. Sound good?",
        talkTrack: [
          "Set clear agenda (3 things)",
          "Tie directly to their pain points",
          "Set time expectation",
          "Get agreement before starting"
        ]
      },
      {
        title: "Demo (Problem → Solution → Outcome)",
        type: "presentation",
        content: "Let me show you... [Demo focused on their specific use case]",
        talkTrack: [
          "Start with the end result (outcome)",
          "Show don't tell - use their data if possible",
          "Pause every 3-5 minutes for questions",
          "Use phrases like 'In your case...' to personalize",
          "Highlight features that solve their specific problems"
        ]
      },
      {
        title: "Social Proof",
        type: "presentation",
        content: "This is exactly what we did for {{similar_company}}. They were facing the same challenge with {{pain_point}} and after implementing our solution, they saw {{specific_result}} in {{timeframe}}.",
        talkTrack: [
          "Use relevant case study",
          "Share specific metrics and timeline",
          "Make the connection to their situation clear",
          "Offer to connect them with reference if needed"
        ]
      },
      {
        title: "Next Steps & Closing",
        type: "closing",
        content: "So that's how we'd help {{company}} solve {{pain_point}}. What questions do you have? ... Based on what you've seen, what do you think? Does this look like it would work for you?",
        talkTrack: [
          "Ask for questions",
          "Ask for their opinion/reaction",
          "Get verbal buy-in before proposing next steps",
          "Suggest sending proposal with specific terms",
          "Schedule follow-up call to review proposal"
        ]
      }
    ],
    objectionHandling: [
      {
        objection: "We need to see it work with our data",
        response: "That's a great point. I can set up a proof of concept using your actual data. Would you be able to provide me with {{specific_data}} so we can show you exactly how this would work in your environment?",
        followUp: "Define clear success criteria for the POC"
      },
      {
        objection: "This seems complicated to implement",
        response: "I hear that concern. Let me show you our implementation timeline for {{similar_company}}. We got them up and running in {{timeframe}} with minimal disruption. Our implementation team handles {{what_we_handle}}, so your team just needs to {{what_they_need}}.",
        followUp: "Provide detailed implementation plan"
      }
    ],
    tips: [
      "Practice demo beforehand - know exactly what you'll show",
      "Customize demo to their specific use case",
      "Don't show every feature - focus on their needs",
      "Have backup plan if demo environment fails",
      "Record the demo (with permission) for those who couldn't attend",
      "Send follow-up email with key screenshots and next steps"
    ]
  },
  {
    id: "4",
    name: "Closing Call - Negotiation",
    type: "scheduled",
    stage: "negotiation",
    objective: "Close the deal and get signed contract",
    usageCount: 29,
    script: [
      {
        title: "Temperature Check",
        type: "opening",
        content: "Thanks for making time to review the proposal. Before we get into details, let me ask - based on what you've seen, are you excited about moving forward with us?",
        talkTrack: [
          "Get their temperature upfront",
          "Identify any concerns early",
          "Gauge their enthusiasm level",
          "Listen for hesitation in their voice"
        ]
      },
      {
        title: "Proposal Review",
        type: "presentation",
        content: "Let me walk through the proposal. We've structured this based on your needs for {{solution_1}}, {{solution_2}}, and {{solution_3}}. The investment is {{price}}, which as we discussed, should deliver {{ROI}} within {{timeframe}}.",
        talkTrack: [
          "Review each component and why it's included",
          "Tie price back to value and ROI",
          "Highlight what's included vs optional",
          "Pause for questions on each section"
        ]
      },
      {
        title: "Assumptive Close",
        type: "closing",
        content: "So if this looks good to you, what we'll do next is get the contract signed today, and we can start the onboarding process as early as {{date}}. How does that sound?",
        talkTrack: [
          "Assume the sale and paint next steps",
          "Give specific timeline and dates",
          "Make it easy to say yes",
          "Stop talking and let them respond"
        ]
      },
      {
        title: "Handle Final Concerns",
        type: "objection",
        content: "What concerns do you have that we haven't addressed?",
        talkTrack: [
          "Surface any remaining objections",
          "Address each one specifically",
          "Get confirmation that concern is resolved",
          "Ask 'What else?' to uncover hidden objections"
        ]
      },
      {
        title: "Ask for the Business",
        type: "closing",
        content: "{{first_name}}, based on everything we've discussed, I believe we're the right partner for {{company}}. Can I earn your business today?",
        talkTrack: [
          "Direct ask for commitment",
          "Silence after asking - wait for response",
          "If yes, move to contract immediately",
          "If no, understand what's missing"
        ]
      }
    ],
    objectionHandling: [
      {
        objection: "We need approval from [executive]",
        response: "I understand. Let me ask - is [executive] supportive of this project? What concerns might they have that we should address proactively?",
        followUp: "Offer to present to the executive or prepare materials for the champion to present"
      },
      {
        objection: "Can you do better on price?",
        response: "Let me understand - if price wasn't a factor, would you be ready to move forward? What budget were you working with?",
        followUp: "Explore payment terms, reduced scope, or additional value before discounting"
      },
      {
        objection: "We need to compare other vendors",
        response: "That's a smart approach. Can I ask - who else are you looking at, and what specifically will you be comparing? I want to make sure you have all the information you need to make the best decision.",
        followUp: "Provide competitive comparison and differentiation"
      }
    ],
    tips: [
      "Show confidence - believe in the value you provide",
      "Use silence strategically after asking for the sale",
      "Be prepared to negotiate on terms, not just price",
      "Have approval to offer concessions before the call",
      "Get a decision - yes or no is better than 'think about it'",
      "If they say no, understand exactly why and what it would take"
    ]
  }
];

export default function CallScripts() {
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeScript, setActiveScript] = useState<CallScript | null>(null);

  const handleUseScript = (script: CallScript) => {
    setActiveScript(script);
    toast.success(`Now using: ${script.name}`);
  };

  const handleDuplicate = (script: CallScript) => {
    toast.success("Script duplicated - ready to customize");
  };

  return (
    <div className="space-y-6">
      <PageHelp
        title="Call Scripts & Playbooks"
        description="Professional call scripts and playbooks for every stage of the sales process."
        features={[
          "Pre-built scripts for every scenario",
          "Objection handling frameworks",
          "Discovery question libraries",
          "Talk tracks and tips",
          "Real-time script guidance",
          "Performance tracking"
        ]}
        tips={[
          "Customize scripts for your product and industry",
          "Practice scripts before using them",
          "Don't read verbatim - use as a guide",
          "Update scripts based on what works",
          "Track which scripts have highest success rates"
        ]}
      />

      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Phone className="h-8 w-8 text-primary" />
            Call Scripts & Playbooks
          </h2>
          <p className="text-muted-foreground">
            Professional scripts for every sales conversation
          </p>
        </div>
        <Button size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Script
        </Button>
      </div>

      {/* Active Script Display */}
      {activeScript && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Active Script</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveScript(null)}>
                Close
              </Button>
            </div>
            <CardDescription>{activeScript.name} - {activeScript.objective}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="script">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="objections">Objections</TabsTrigger>
                <TabsTrigger value="tips">Tips</TabsTrigger>
              </TabsList>

              <TabsContent value="script" className="space-y-4 mt-4">
                <Accordion type="single" collapsible className="w-full">
                  {activeScript.script.map((section, index) => (
                    <AccordionItem key={index} value={`section-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-semibold">{section.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                            <p className="text-sm text-blue-900 whitespace-pre-wrap">{section.content}</p>
                          </div>
                          {section.talkTrack.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">Talk Track:</h4>
                              <ul className="space-y-1">
                                {section.talkTrack.map((track, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                    <span>{track}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="objections" className="space-y-4 mt-4">
                {activeScript.objectionHandling.map((obj, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <CardTitle className="text-base text-orange-900">"{obj.objection}"</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Response:</Label>
                        <p className="text-sm mt-1">{obj.response}</p>
                      </div>
                      {obj.followUp && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Follow-up:</Label>
                          <p className="text-sm mt-1 text-blue-800">{obj.followUp}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="tips" className="space-y-2 mt-4">
                {activeScript.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-accent rounded-lg">
                    <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Script Library */}
      <div className="grid gap-4 md:grid-cols-2">
        {CALL_SCRIPT_TEMPLATES.map((script) => (
          <Card key={script.id} className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{script.name}</CardTitle>
                  <CardDescription>{script.objective}</CardDescription>
                </div>
                <Badge variant="secondary">{script.usageCount} uses</Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline">
                  {script.type === "outbound" ? "Outbound" : "Scheduled"}
                </Badge>
                <Badge variant="outline">
                  {script.stage.charAt(0).toUpperCase() + script.stage.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Script Sections:</h4>
                  <div className="flex flex-wrap gap-2">
                    {script.script.map((section, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {section.title}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Includes:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{script.script.length} sections</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{script.objectionHandling.length} objections</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>{script.tips.length} tips</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => handleUseScript(script)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Use Script
                  </Button>
                  <Button variant="outline" onClick={() => handleDuplicate(script)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
