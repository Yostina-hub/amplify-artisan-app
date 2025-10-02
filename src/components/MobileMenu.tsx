import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const industries = [
  "Small business", "Real estate", "Financial services", "Government",
  "Healthcare", "Education", "Professional services", "Legal", "Agencies", "Nonprofit"
];

const features = [
  "Content Scheduling", "Analytics", "Social Inbox", 
  "AI Assistant", "Team Collaboration", "Social Listening"
];

const resources = [
  "Blog", "Webinars", "Case Studies", "Help Center"
];

export const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 bg-white overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="features">
              <AccordionTrigger className="text-sm font-medium">
                Top features
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-4">
                  {features.map((feature) => (
                    <div key={feature} className="text-sm text-muted-foreground py-2">
                      {feature}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="industries">
              <AccordionTrigger className="text-sm font-medium">
                Industries
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  {industries.map((industry) => (
                    <div key={industry} className="text-sm text-muted-foreground py-2">
                      {industry}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="resources">
              <AccordionTrigger className="text-sm font-medium">
                Resources
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-4">
                  {resources.map((resource) => (
                    <div key={resource} className="text-sm text-muted-foreground py-2">
                      {resource}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <a href="#integrations" onClick={() => setOpen(false)} className="block text-sm font-medium py-2">
            Integrations
          </a>
          <a href="#pricing" onClick={() => setOpen(false)} className="block text-sm font-medium py-2">
            Pricing
          </a>
          <a href="#enterprise" onClick={() => setOpen(false)} className="block text-sm font-medium py-2">
            Enterprise
          </a>

          <div className="pt-4 space-y-3 border-t">
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => handleNavigation("/auth")}
            >
              Log in
            </Button>
            <Button 
              className="w-full"
              onClick={() => handleNavigation("/auth")}
            >
              Start your free trial
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
