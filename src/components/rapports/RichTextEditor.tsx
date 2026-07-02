import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Minus,
  Table as TableIcon, Image as ImageIcon, Link as LinkIcon, Sparkles, Heading1, Heading2,
  Undo2, Redo2, Variable,
} from "lucide-react";
import { AVAILABLE_VARIABLES } from "@/lib/rapports/templateEngine";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  onAIAction?: (selectedText: string, editor: Editor) => void;
}

export default function RichTextEditor({ value, onChange, onAIAction }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: false }),
      TableRow, TableCell, TableHeader,
      Placeholder.configure({ placeholder: "Rédigez ou générez le rapport avec l'IA…" }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[400px] p-4 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const insertVariable = (key: string) => editor.chain().focus().insertContent(`{{${key}}}`).run();
  const addLink = () => {
    const url = window.prompt("URL du lien");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };
  const addImage = () => {
    const url = window.prompt("URL de l'image");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };
  const askAI = () => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    if (!text.trim()) return;
    onAIAction?.(text, editor);
  };

  const btn = (active: boolean) =>
    `h-8 px-2 ${active ? "bg-primary/10 text-primary" : ""}`;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 items-center border-b p-2 bg-muted/30">
        <Button size="sm" variant="ghost" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Button>
        <span className="w-px h-6 bg-border mx-1" />
        <Button size="sm" variant="ghost" className={btn(editor.isActive("heading", { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Button>
        <span className="w-px h-6 bg-border mx-1" />
        <Button size="sm" variant="ghost" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Button>
        <span className="w-px h-6 bg-border mx-1" />
        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={addLink}><LinkIcon className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 px-2"><Variable className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {AVAILABLE_VARIABLES.map(v => (
              <DropdownMenuItem key={v.key} onClick={() => insertVariable(v.key)}>
                <code className="text-xs mr-2">{`{{${v.key}}}`}</code>{v.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="w-px h-6 bg-border mx-1" />
        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></Button>
        <div className="ml-auto">
          <Button size="sm" variant="outline" onClick={askAI} className="h-8">
            <Sparkles className="h-4 w-4 mr-1 text-primary" /> IA sur sélection
          </Button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
