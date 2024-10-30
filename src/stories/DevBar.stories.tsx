import type { Meta, StoryFn } from "@storybook/react";
import { Bug, Palette, Settings } from "lucide-react";
import { DevBar } from "../DevBar";
import "../../dist/styles.css";

export default {
	title: "Components/DevBar",
	component: DevBar,
	argTypes: {},
} as Meta<typeof DevBar>;

const Template: StoryFn<typeof DevBar> = (args) => <DevBar {...args} />;

const defaultTools = [
	{
		name: "Settings",
		icon: Settings,
	},
	{
		name: "Theme",
		icon: Palette,
	},
	{
		icon: Bug,
	},
];

export const Horizontal = Template.bind({});
Horizontal.args = {
	tools: defaultTools,
	orientation: "horizontal",
	defaultOpen: true,
};

export const DefaultClosed = Template.bind({});
DefaultClosed.args = {
	tools: defaultTools,
	orientation: "horizontal",
	defaultOpen: false,
};

export const WithHotkey = Template.bind({});
WithHotkey.args = {
	tools: defaultTools,
	orientation: "horizontal",
	hotkey: ["Meta", "KeyI"],
	showToggle: false,
};
WithHotkey.storyName = "With Keyboard (Cmd+I)";

export const HorizontalTopLeft = Template.bind({});
HorizontalTopLeft.args = {
	tools: defaultTools,
	orientation: "horizontal",
	defaultOpen: true,
};

export const Vertical = Template.bind({});
Vertical.args = {
	tools: defaultTools,
	orientation: "vertical",
	defaultOpen: true,
};
