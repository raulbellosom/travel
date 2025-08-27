import React from "react";
import {
  Button,
  Badge,
  TextInput,
  Spinner,
  CodeBlock,
} from "../../../components/common";
import ComponentDemo from "../../../components/common/molecules/ComponentDemo/ComponentDemo";
import { Mail, Search } from "lucide-react";

/**
 * Atoms section - Basic UI building blocks
 */
const AtomsSection = () => {
  return (
    <>
      {/* Buttons */}
      <ComponentDemo
        title="Buttons"
        code={`// Button Examples
<Button variant="primary" size="md">
  Primary Button
</Button>
<Button variant="secondary" size="lg">
  Secondary Button
</Button>
<Button variant="outline" size="sm">
  Outline Button
</Button>
<Button variant="ghost" disabled>
  Disabled Button
</Button>`}
      >
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" size="md">
            Primary Button
          </Button>
          <Button variant="secondary" size="lg">
            Secondary Button
          </Button>
          <Button variant="outline" size="sm">
            Outline Button
          </Button>
          <Button variant="ghost" disabled>
            Disabled Button
          </Button>
        </div>
      </ComponentDemo>

      {/* Text Inputs */}
      <ComponentDemo
        title="Text Inputs"
        code={`// Text Input Examples
<TextInput
  label="Email"
  placeholder="Enter your email"
  icon={Mail}
  size="md"
/>
<TextInput
  label="Search"
  placeholder="Search..."
  icon={Search}
  size="lg"
/>
<TextInput
  label="Disabled Input"
  placeholder="Cannot edit"
  disabled
/>`}
      >
        <div className="space-y-4 max-w-md">
          <TextInput
            label="Email"
            placeholder="Enter your email"
            icon={Mail}
            size="md"
          />
          <TextInput
            label="Search"
            placeholder="Search..."
            icon={Search}
            size="lg"
          />
          <TextInput
            label="Disabled Input"
            placeholder="Cannot edit"
            disabled
          />
        </div>
      </ComponentDemo>

      {/* Badges */}
      <ComponentDemo
        title="Badges"
        code={`// Badge Examples
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>`}
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </ComponentDemo>

      {/* Loading States */}
      <ComponentDemo
        title="Loading States"
        code={`// Spinner Examples
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
<Button variant="primary" disabled>
  <Spinner size="sm" />
  Loading...
</Button>`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <Button variant="primary" disabled>
            <Spinner size="sm" />
            Loading...
          </Button>
        </div>
      </ComponentDemo>

      {/* Code Blocks */}
      <ComponentDemo
        title="Code Blocks"
        code={`// CodeBlock Examples
<CodeBlock
  language="javascript"
  title="Example Function"
  code={\`const greet = (name) => {
  return \\\`Hello, \\\${name}!\\\`;
};\`}
/>
<CodeBlock
  language="jsx"
  showLineNumbers
  code={\`const Button = ({ children, onClick }) => (
  <button onClick={onClick}>
    {children}
  </button>
);\`}
/>`}
      >
        <div className="space-y-4">
          <CodeBlock
            language="javascript"
            title="Example Function"
            code={`const greet = (name) => {
  return \`Hello, \${name}!\`;
};

// Llamar la función
console.log(greet("Usuario"));`}
          />
          <CodeBlock
            language="jsx"
            title="React Component"
            showLineNumbers
            code={`const Button = ({ children, onClick, variant = "primary" }) => {
  const baseStyles = "px-4 py-2 rounded font-medium transition-colors";
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
  };

  return (
    <button 
      className={\`\${baseStyles} \${variantStyles[variant]}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};`}
          />
        </div>
      </ComponentDemo>
    </>
  );
};

export default AtomsSection;
