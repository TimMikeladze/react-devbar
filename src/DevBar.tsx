"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { Options } from "react-hotkeys-hook";
import { Button } from "./components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./components/ui/tooltip";
import { cn } from "./lib/utils";

const X = ({ className }: { className?: string }) => (
	// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={cn("lucide lucide-x", className)}
	>
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	</svg>
);

const GripHorizontal = ({ className }: { className?: string }) => (
	// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={cn("lucide lucide-grip-horizontal", className)}
	>
		<circle cx="12" cy="9" r="1" />
		<circle cx="19" cy="9" r="1" />
		<circle cx="5" cy="9" r="1" />
		<circle cx="12" cy="15" r="1" />
		<circle cx="19" cy="15" r="1" />
		<circle cx="5" cy="15" r="1" />
	</svg>
);

export interface DevBarTool {
	name?: string;
	icon: React.ElementType;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	// biome-ignore lint/style/useNamingConvention: <explanation>
	Component?: React.ComponentType<any>;
}

type DevBarPosition =
	| "top-left"
	| "top-center"
	| "top-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right"
	| "center-left"
	| "center-right"
	| "center";

interface DevBarProps {
	tools: DevBarTool[];
	orientation?: "horizontal" | "vertical";
	defaultPosition?: DevBarPosition | { x: number; y: number };
	defaultOpen?: boolean;
	hotkey?: string;
	hotKeyOptions?: Options;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	CommandIcon?: React.ElementType;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	GripIcon?: React.ElementType;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	CloseIcon?: React.ElementType;
	containerClassName?: string;
	toolbarClassName?: string;
	toolbarContentClassName?: string;
	moveButtonClassName?: string;
	toolsContainerClassName?: string;
	toolButtonClassName?: string;
	controlsContainerClassName?: string;
	closeButtonClassName?: string;
	openButtonClassName?: string;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	ButtonComponent?: typeof Button;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	TooltipComponent?: typeof Tooltip;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	TooltipTriggerComponent?: typeof TooltipTrigger;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	TooltipContentComponent?: typeof TooltipContent;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	TooltipProviderComponent?: typeof TooltipProvider;
	moveButtonLabel?: string;
	closeToolbarLabel?: string;
	openToolbarLabel?: string;
}

export const DEFAULT_CONTAINER_CLASS = "fixed z-50 devbar-container";
export const DEFAULT_TOOLBAR_CLASS =
	"rounded-full border border-border bg-background shadow-lg devbar-toolbar";
export const DEFAULT_TOOLBAR_CONTENT_CLASS =
	"flex items-center px-4 py-2 devbar-toolbar-content";
export const DEFAULT_MOVE_BUTTON_CLASS = "cursor-move devbar-move-button";
export const DEFAULT_TOOLS_CONTAINER_CLASS =
	"flex items-center devbar-tools-container";
export const DEFAULT_TOOL_BUTTON_CLASS =
	"text-muted-foreground hover:text-foreground devbar-tool-button";
export const DEFAULT_CONTROLS_CONTAINER_CLASS =
	"flex items-center devbar-controls-container";
export const DEFAULT_CLOSE_BUTTON_CLASS =
	"text-muted-foreground hover:text-foreground devbar-close-button";
export const DEFAULT_OPEN_BUTTON_CLASS =
	"fixed z-[9999] rounded-full shadow-md devbar-open-button";

export const DEFAULT_MOVE_BUTTON_LABEL = "Move toolbar";
export const DEFAULT_CLOSE_TOOLBAR_LABEL = "Close toolbar";
export const DEFAULT_OPEN_TOOLBAR_LABEL = "Open Toolbar";

const getPositionCoordinates = (
	position: DevBarPosition,
	rect: DOMRect,
): { x: number; y: number } => {
	const padding = 20;

	switch (position) {
		case "top-left":
			return { x: padding, y: padding };
		case "top-center":
			return { x: (window.innerWidth - rect.width) / 2, y: padding };
		case "top-right":
			return { x: window.innerWidth - rect.width - padding, y: padding };
		case "center-left":
			return { x: padding, y: (window.innerHeight - rect.height) / 2 };
		case "center":
			return {
				x: (window.innerWidth - rect.width) / 2,
				y: (window.innerHeight - rect.height) / 2,
			};
		case "center-right":
			return {
				x: window.innerWidth - rect.width - padding,
				y: (window.innerHeight - rect.height) / 2,
			};
		case "bottom-left":
			return { x: padding, y: window.innerHeight - rect.height - padding };
		case "bottom-center":
			return {
				x: (window.innerWidth - rect.width) / 2,
				y: window.innerHeight - rect.height - padding,
			};
		case "bottom-right":
			return {
				x: window.innerWidth - rect.width - padding,
				y: window.innerHeight - rect.height - padding,
			};
		default:
			return { x: 0, y: 0 };
	}
};

export function DevBar(props: DevBarProps) {
	const [isOpen, setIsOpen] = useState(props.defaultOpen ?? true);
	const [position, setPosition] = useState<{ x: number; y: number }>(
		typeof props.defaultPosition === "object"
			? props.defaultPosition
			: { x: 0, y: 0 },
	);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const isDragging = useRef(false);
	const dragStart = useRef({ x: 0, y: 0 });

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			isDragging.current = true;
			dragStart.current = {
				x: e.clientX - position.x,
				y: e.clientY - position.y,
			};
		},
		[position],
	);

	const handleMouseMove = useCallback((e: MouseEvent) => {
		if (!isDragging.current) {
			return;
		}
		const newX = e.clientX - dragStart.current.x;
		const newY = e.clientY - dragStart.current.y;
		setPosition({ x: newX, y: newY });
	}, []);

	const handleMouseUp = useCallback(() => {
		isDragging.current = false;
	}, []);

	useEffect(() => {
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);

	useEffect(() => {
		if (toolbarRef.current) {
			const rect = toolbarRef.current.getBoundingClientRect();
			if (typeof props.defaultPosition === "string") {
				setPosition(getPositionCoordinates(props.defaultPosition, rect));
			} else if (!props.defaultPosition) {
				setPosition(getPositionCoordinates("bottom-center", rect));
			}
		}
	}, [props.defaultPosition]);

	useHotkeys(
		props.hotkey ?? "meta+i",
		() => setIsOpen((prev) => !prev),
		props.hotKeyOptions,
		[isOpen],
	);

	const TooltipProviderComponent =
		props.TooltipProviderComponent ?? TooltipProvider;
	const ButtonComponent = props.ButtonComponent ?? Button;
	const TooltipComponent = props.TooltipComponent ?? Tooltip;
	const TooltipTriggerComponent =
		props.TooltipTriggerComponent ?? TooltipTrigger;
	const TooltipContentComponent =
		props.TooltipContentComponent ?? TooltipContent;
	const GripIcon = props.GripIcon ?? GripHorizontal;
	const CloseIcon = props.CloseIcon ?? X;

	return (
		<TooltipProviderComponent>
			{isOpen && (
				<div
					ref={toolbarRef}
					className={cn(props.containerClassName ?? DEFAULT_CONTAINER_CLASS)}
					style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
				>
					<div className={cn(props.toolbarClassName ?? DEFAULT_TOOLBAR_CLASS)}>
						<div
							className={cn(
								(props.orientation ?? "horizontal") === "vertical" &&
									"flex-col space-y-2",
								props.toolbarContentClassName ?? DEFAULT_TOOLBAR_CONTENT_CLASS,
							)}
						>
							<ButtonComponent
								variant="ghost"
								size="sm"
								className={cn(
									(props.orientation ?? "horizontal") === "vertical"
										? "devbar-move-button-vertical mb-2"
										: "devbar-move-button-horizontal mr-2",
									props.moveButtonClassName ?? DEFAULT_MOVE_BUTTON_CLASS,
								)}
								onMouseDown={handleMouseDown}
							>
								<GripIcon className="h-4 w-4" />
								<span className="sr-only">
									{props.moveButtonLabel ?? DEFAULT_MOVE_BUTTON_LABEL}
								</span>
							</ButtonComponent>
							<div
								className={cn(
									(props.orientation ?? "horizontal") === "vertical"
										? "flex-col space-y-2"
										: "space-x-2",
									props.toolsContainerClassName ??
										DEFAULT_TOOLS_CONTAINER_CLASS,
								)}
							>
								{props.tools.map((tool) => (
									<TooltipComponent key={tool.name}>
										<TooltipTriggerComponent asChild={true}>
											{tool.Component ? (
												<tool.Component>
													<tool.icon className="h-4 w-4" />
													<span className="sr-only">{tool.name}</span>
												</tool.Component>
											) : (
												<ButtonComponent
													variant="ghost"
													size="sm"
													className={cn(
														props.toolButtonClassName ??
															DEFAULT_TOOL_BUTTON_CLASS,
													)}
												>
													<tool.icon className="h-4 w-4" />
													<span className="sr-only">{tool.name}</span>
												</ButtonComponent>
											)}
										</TooltipTriggerComponent>
										<TooltipContentComponent>
											<p>{tool.name}</p>
										</TooltipContentComponent>
									</TooltipComponent>
								))}
							</div>
							<div
								className={cn(
									(props.orientation ?? "horizontal") === "vertical"
										? "flex-col space-y-2"
										: "ml-auto space-x-2",
									props.controlsContainerClassName ??
										DEFAULT_CONTROLS_CONTAINER_CLASS,
								)}
							>
								<ButtonComponent
									variant="ghost"
									size="sm"
									onClick={() => setIsOpen(false)}
									className={cn(
										props.closeButtonClassName ?? DEFAULT_CLOSE_BUTTON_CLASS,
									)}
								>
									<CloseIcon className="h-4 w-4" />
									<span className="sr-only">
										{props.closeToolbarLabel ?? DEFAULT_CLOSE_TOOLBAR_LABEL}
									</span>
								</ButtonComponent>
							</div>
						</div>
					</div>
				</div>
			)}
		</TooltipProviderComponent>
	);
}
