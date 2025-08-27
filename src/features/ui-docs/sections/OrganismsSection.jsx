import React from "react";
import { Button, Card, TextInput } from "../../../components/common";
import ComponentDemo from "../../../components/common/molecules/ComponentDemo/ComponentDemo";
import { Mail } from "lucide-react";

/**
 * Organisms section - Complex components
 */
const OrganismsSection = () => {
  return (
    <>
      {/* Complex Form */}
      <ComponentDemo
        title="Complex Form"
        code={`// Complex Form Example
<Card className="p-6">
  <h3 className="text-xl font-semibold mb-4">Contact Form</h3>
  <div className="space-y-4">
    <TextInput label="Name" placeholder="Your name" />
    <TextInput label="Email" placeholder="your@email.com" icon={Mail} />
    <div className="flex gap-2">
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Submit</Button>
    </div>
  </div>
</Card>`}
      >
        <Card className="p-6 max-w-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Contact Form
          </h3>
          <div className="space-y-4">
            <TextInput label="Name" placeholder="Your name" />
            <TextInput label="Email" placeholder="your@email.com" icon={Mail} />
            <div className="flex gap-2">
              <Button variant="outline">Cancel</Button>
              <Button variant="primary">Submit</Button>
            </div>
          </div>
        </Card>
      </ComponentDemo>

      {/* Card Grid */}
      <ComponentDemo
        title="Card Grid"
        code={`// Card Grid Example
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {[1, 2, 3].map(i => (
    <Card key={i} hover>
      <h4>Card {i}</h4>
      <p>Sample content for card {i}</p>
    </Card>
  ))}
</div>`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} hover className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Card {i}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Sample content for card {i}
              </p>
            </Card>
          ))}
        </div>
      </ComponentDemo>
    </>
  );
};

export default OrganismsSection;
