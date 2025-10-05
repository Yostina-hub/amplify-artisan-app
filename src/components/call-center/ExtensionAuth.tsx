import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Delete } from "lucide-react";

interface ExtensionAuthProps {
  onAuthenticate: (extension: string) => void;
}

export default function ExtensionAuth({ onAuthenticate }: ExtensionAuthProps) {
  const [extension, setExtension] = useState("");

  const handleDigit = (digit: string) => {
    if (extension.length < 10) {
      setExtension(extension + digit);
    }
  };

  const handleClear = () => {
    setExtension("");
  };

  const handleBackspace = () => {
    setExtension(extension.slice(0, -1));
  };

  const handleSubmit = () => {
    if (extension.trim()) {
      onAuthenticate(extension);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && extension.trim()) {
      handleSubmit();
    }
  };

  const dialpadButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["Clear", "0", "⌫"],
  ];

  return (
    <div className="flex items-center justify-center min-h-[600px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Phone className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Call Extension</CardTitle>
          <CardDescription>Enter your extension number to access the softphone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter extension..."
              value={extension}
              onChange={(e) => setExtension(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyPress={handleKeyPress}
              className="text-center text-2xl h-16 font-mono tracking-wider"
              maxLength={10}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {dialpadButtons.map((row, rowIndex) =>
              row.map((digit, colIndex) => (
                <Button
                  key={`${rowIndex}-${colIndex}`}
                  variant={digit === "Clear" || digit === "⌫" ? "outline" : "secondary"}
                  size="lg"
                  onClick={() => {
                    if (digit === "Clear") {
                      handleClear();
                    } else if (digit === "⌫") {
                      handleBackspace();
                    } else {
                      handleDigit(digit);
                    }
                  }}
                  className="h-16 text-xl font-semibold"
                >
                  {digit === "⌫" ? <Delete className="h-5 w-5" /> : digit}
                </Button>
              ))
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!extension.trim()}
            className="w-full h-14 text-lg"
            size="lg"
          >
            <Phone className="mr-2 h-5 w-5" />
            Call Extension
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
