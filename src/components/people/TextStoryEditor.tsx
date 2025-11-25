import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TextStoryEditorProps {
  onSave: (storyData: { text: string; font: string; color: string; fontSize: number; background: string }) => void;
  onBack: () => void;
}

const FONTS = [
  { name: "Default", value: "Inter, sans-serif" },
  { name: "Graffiti", value: "Bangers, cursive" },
  { name: "Neon", value: "Monoton, cursive" },
  { name: "Spooky", value: "Creepster, cursive" },
  { name: "Bubble", value: "Righteous, cursive" },
  { name: "Fancy", value: "Fascinate, cursive" },
];

const GRADIENTS = [
  { name: "Fire", value: "linear-gradient(135deg, #ff4500, #ff8c00, #ffd700)" },
  { name: "Neon", value: "linear-gradient(135deg, #0ff, #f0f, #ff0)" },
  { name: "Rainbow", value: "linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)" },
  { name: "Ocean", value: "linear-gradient(135deg, #006994, #00d4ff)" },
  { name: "Sunset", value: "linear-gradient(135deg, #ff6b6b, #ff8e53, #ffd93d)" },
];

const SOLID_COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Yellow", value: "#ffd700" },
  { name: "Pink", value: "#ff69b4" },
  { name: "Cyan", value: "#00ffff" },
  { name: "Lime", value: "#00ff00" },
  { name: "Red", value: "#ff0000" },
];

export const TextStoryEditor = ({ onSave, onBack }: TextStoryEditorProps) => {
  const [text, setText] = useState("");
  const [font, setFont] = useState(FONTS[0].value);
  const [colorType, setColorType] = useState<"solid" | "gradient">("solid");
  const [solidColor, setSolidColor] = useState("#ffffff");
  const [gradient, setGradient] = useState(GRADIENTS[0].value);
  const [fontSize, setFontSize] = useState(48);
  const [background, setBackground] = useState("#000000");

  const handleSave = () => {
    if (!text.trim()) return;
    
    onSave({
      text: text.trim(),
      font,
      color: colorType === "solid" ? solidColor : gradient,
      fontSize,
      background,
    });
  };

  const currentColor = colorType === "solid" ? solidColor : gradient;

  return (
    <div className="space-y-4">
      {/* Live Preview */}
      <div 
        className="w-full h-48 rounded-lg flex items-center justify-center p-4 overflow-hidden"
        style={{ backgroundColor: background }}
      >
        <p
          className="text-center break-words max-w-full"
          style={{
            fontFamily: font,
            fontSize: `${fontSize}px`,
            background: colorType === "gradient" ? currentColor : "transparent",
            color: colorType === "solid" ? currentColor : "transparent",
            backgroundClip: colorType === "gradient" ? "text" : "border-box",
            WebkitBackgroundClip: colorType === "gradient" ? "text" : "border-box",
            WebkitTextFillColor: colorType === "gradient" ? "transparent" : currentColor,
            lineHeight: 1.2,
          }}
        >
          {text || "Your story text..."}
        </p>
      </div>

      {/* Text Input */}
      <div>
        <Label>Your Text</Label>
        <Textarea
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[80px]"
          maxLength={150}
        />
        <p className="text-xs text-muted-foreground mt-1">{text.length}/150</p>
      </div>

      {/* Font Selector */}
      <div>
        <Label>Font</Label>
        <Select value={font} onValueChange={setFont}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Type Toggle */}
      <div>
        <Label>Color Style</Label>
        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant={colorType === "solid" ? "default" : "outline"}
            size="sm"
            onClick={() => setColorType("solid")}
          >
            Solid
          </Button>
          <Button
            type="button"
            variant={colorType === "gradient" ? "default" : "outline"}
            size="sm"
            onClick={() => setColorType("gradient")}
          >
            Gradient
          </Button>
        </div>
      </div>

      {/* Color Selection */}
      {colorType === "solid" ? (
        <div>
          <Label>Text Color</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SOLID_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSolidColor(c.value)}
                className={`w-10 h-10 rounded-full border-2 ${
                  solidColor === c.value ? "border-primary ring-2 ring-primary/50" : "border-border"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
            <input
              type="color"
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              className="w-10 h-10 rounded-full border-2 border-border cursor-pointer"
              title="Custom color"
            />
          </div>
        </div>
      ) : (
        <div>
          <Label>Gradient</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {GRADIENTS.map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => setGradient(g.value)}
                className={`h-10 rounded-md border-2 ${
                  gradient === g.value ? "border-primary ring-2 ring-primary/50" : "border-border"
                }`}
                style={{ background: g.value }}
              >
                <span className="text-xs font-semibold text-white drop-shadow-md">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Font Size */}
      <div>
        <Label>Font Size: {fontSize}px</Label>
        <Slider
          value={[fontSize]}
          onValueChange={([value]) => setFontSize(value)}
          min={24}
          max={72}
          step={2}
          className="mt-2"
        />
      </div>

      {/* Background Color */}
      <div>
        <Label>Background</Label>
        <div className="flex gap-2 mt-2 items-center">
          <input
            type="color"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="w-12 h-10 rounded-md border-2 border-border cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">{background}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={!text.trim()}>
          Post Story
        </Button>
      </div>
    </div>
  );
};
