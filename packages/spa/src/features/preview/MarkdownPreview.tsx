import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./MermaidDiagram";

interface MarkdownPreviewProps {
	content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
	return (
		<div className="preview-content p-5 max-w-[900px] mx-auto">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					code({ className, children, ...props }) {
						const match = /language-mermaid/.exec(
							className || "",
						);
						if (match) {
							return (
								<MermaidDiagram
									code={String(children).replace(
										/\n$/,
										"",
									)}
								/>
							);
						}
						// Check if this is an inline code (no className typically)
						const isInline = !className;
						if (isInline) {
							return <code {...props}>{children}</code>;
						}
						return (
							<code className={className} {...props}>
								{children}
							</code>
						);
					},
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
