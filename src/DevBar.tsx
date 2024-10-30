"use client";

import { ChevronUp, GripHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./components/ui/tooltip";
import { cn } from "./lib/utils";

interface Tool {
	name?: string;
	icon: React.ElementType;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	Component?: React.ComponentType<any>;
}

interface DevBarProps {
	tools: Tool[];
	orientation?: "horizontal" | "vertical";
	defaultPosition?: { x: number; y: number };
	togglePosition?:
		| "top-left"
		| "top-right"
		| "top-center"
		| "bottom-left"
		| "bottom-right"
		| "bottom-center"
		| "left-center"
		| "right-center"
		| "center";
	showToggle?: boolean;
	defaultOpen?: boolean;
	hotkey?: string[];
	// Icon components
	// biome-ignore lint/style/useNamingConvention: <explanation>
	ChevronUpIcon?: React.ElementType;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	CommandIcon?: React.ElementType;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	GripIcon?: React.ElementType;
	// biome-ignore lint/style/useNamingConvention: <explanation>
	CloseIcon?: React.ElementType;
	// Class name props
	containerClassName?: string;
	toolbarClassName?: string;
	toolbarContentClassName?: string;
	moveButtonClassName?: string;
	toolsContainerClassName?: string;
	toolButtonClassName?: string;
	controlsContainerClassName?: string;
	closeButtonClassName?: string;
	openButtonClassName?: string;
	// Component slots
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
	// Label props
	moveButtonLabel?: string;
	closeToolbarLabel?: string;
	openToolbarLabel?: string;
}

export const DEFAULT_CONTAINER_CLASS = "fixed z-50";
export const DEFAULT_TOOLBAR_CLASS =
	"rounded-full border border-border bg-background shadow-lg";
export const DEFAULT_TOOLBAR_CONTENT_CLASS = "flex items-center px-4 py-2";
export const DEFAULT_MOVE_BUTTON_CLASS = "cursor-move";
export const DEFAULT_TOOLS_CONTAINER_CLASS = "flex items-center";
export const DEFAULT_TOOL_BUTTON_CLASS =
	"text-muted-foreground hover:text-foreground";
export const DEFAULT_CONTROLS_CONTAINER_CLASS = "flex items-center";
export const DEFAULT_CLOSE_BUTTON_CLASS =
	"text-muted-foreground hover:text-foreground";
export const DEFAULT_OPEN_BUTTON_CLASS =
	"fixed z-[9999] rounded-full shadow-md";

export const DEFAULT_MOVE_BUTTON_LABEL = "Move toolbar";
export const DEFAULT_CLOSE_TOOLBAR_LABEL = "Close toolbar";
export const DEFAULT_OPEN_TOOLBAR_LABEL = "Open Toolbar";

export function DevBar(props: DevBarProps) {
	const [isOpen, setIsOpen] = useState(props.defaultOpen ?? true);
	const [position, setPosition] = useState(
		props.defaultPosition ?? { x: 0, y: 0 },
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
		if (!props.defaultPosition && toolbarRef.current) {
			const rect = toolbarRef.current.getBoundingClientRect();
			setPosition({
				x: (window.innerWidth - rect.width) / 2,
				y: window.innerHeight - rect.height - 20,
			});
		}
	}, [props.defaultPosition]);
	useEffect(() => {
		const pressedKeys = new Set();
		const requiredKeys = new Set(props.hotkey ?? ["MetaLeft", "KeyI"]);

		const handleKeyDown = (e: KeyboardEvent) => {
			// Only add the current key if all other required keys are pressed
			const otherRequiredKeys = Array.from(requiredKeys).filter(
				(key) => key !== e.code,
			);
			const otherKeysPressed = otherRequiredKeys.every((key) => {
				// Check if the key is currently pressed using e.getModifierState() for modifier keys
				if (
					key.startsWith("Meta") ||
					key.startsWith("Alt") ||
					key.startsWith("Control") ||
					key.startsWith("Shift")
				) {
					const modifier = key.replace("Left", "").replace("Right", "");
					return e.getModifierState(modifier);
				}
				return pressedKeys.has(key);
			});

			if (otherKeysPressed) {
				pressedKeys.add(e.code);

				const allKeysPressed = Array.from(requiredKeys).every((key) =>
					pressedKeys.has(key),
				);

				if (allKeysPressed) {
					e.preventDefault();
					setIsOpen((prev) => !prev);
				}
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			pressedKeys.delete(e.code);
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, [props.hotkey]);

	const getOpenButtonPosition = () => {
		const positions = {
			"top-left": "left-4 top-4",
			"top-right": "right-4 top-4",
			"top-center": "left-1/2 -translate-x-1/2 top-4",
			"bottom-left": "left-4 bottom-4",
			"bottom-right": "right-4 bottom-4",
			"bottom-center": "left-1/2 -translate-x-1/2 bottom-4",
			"left-center": "left-4 top-1/2 -translate-y-1/2",
			"right-center": "right-4 top-1/2 -translate-y-1/2",
			center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
		};
		return positions[props.togglePosition ?? "bottom-right"];
	};

	const TooltipProviderComponent =
		props.TooltipProviderComponent ?? TooltipProvider;
	const ButtonComponent = props.ButtonComponent ?? Button;
	const TooltipComponent = props.TooltipComponent ?? Tooltip;
	const TooltipTriggerComponent =
		props.TooltipTriggerComponent ?? TooltipTrigger;
	const TooltipContentComponent =
		props.TooltipContentComponent ?? TooltipContent;
	const ChevronUpIcon = props.ChevronUpIcon ?? ChevronUp;
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
										? "mb-2"
										: "mr-2",
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
			{!isOpen && (props.showToggle ?? true) && (
				<ButtonComponent
					variant="outline"
					size="sm"
					onClick={() => setIsOpen(true)}
					className={cn(
						props.openButtonClassName ?? DEFAULT_OPEN_BUTTON_CLASS,
						"fixed",
						getOpenButtonPosition(),
					)}
				>
					<ChevronUpIcon className="mr-2 h-4 w-4" />
					{props.openToolbarLabel ?? DEFAULT_OPEN_TOOLBAR_LABEL}
				</ButtonComponent>
			)}
		</TooltipProviderComponent>
	);
}
