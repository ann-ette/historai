import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string) => void;
  figureName: string;
}

export function QuestionModal({ isOpen, onClose, onSubmit, figureName }: QuestionModalProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question.trim());
      setQuestion("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-[#0d131f]/95 border border-gray-700/30 backdrop-blur-md text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-center">Ask a question</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`What would you like to ask ${figureName}?`}
            className="w-full p-3 rounded bg-[#1b2230] border border-gray-700/30 text-white focus:ring-1 focus:ring-gray-500 focus:outline-none resize-none"
            rows={4}
            required
          />
          <DialogFooter className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600/50 text-white/80 hover:bg-gray-800/50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-2 bg-[#1b2230] text-white hover:bg-[#272e3b] transition-colors"
            >
              Ask
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
