import React, { useState } from "react";
import { Button, Card, Modal } from "../../../components/common";
import ComponentDemo from "../../../components/common/molecules/ComponentDemo/ComponentDemo";
import { Mail } from "lucide-react";

/**
 * Molecules section - Combination of atoms
 */
const MoleculesSection = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Cards */}
      <ComponentDemo
        title="Cards"
        code={`// Card Examples
<Card className="p-6">
  <h3 className="text-lg font-semibold mb-2">Basic Card</h3>
  <p className="text-gray-600">This is a basic card component.</p>
</Card>
<Card className="p-6" hover>
  <h3 className="text-lg font-semibold mb-2">Interactive Card</h3>
  <p className="text-gray-600">This card has hover effects.</p>
</Card>`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Basic Card
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This is a basic card component.
            </p>
          </Card>
          <Card className="p-6" hover>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Interactive Card
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This card has hover effects.
            </p>
          </Card>
        </div>
      </ComponentDemo>

      {/* Modals */}
      <ComponentDemo
        title="Modals"
        code={`// Modal Examples
<Button onClick={() => setShowModal(true)}>
  Open Modal
</Button>
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Example Modal"
  size="md"
>
  <p>This is the modal content.</p>
</Modal>`}
      >
        <div>
          <Button onClick={() => setShowModal(true)}>Open Modal</Button>
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Example Modal"
            size="md"
          >
            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This is the modal content. You can put any content here.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setShowModal(false)}>
                  Confirm
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </ComponentDemo>
    </>
  );
};

export default MoleculesSection;
