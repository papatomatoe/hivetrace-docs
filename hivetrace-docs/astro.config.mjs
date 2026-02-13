// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
	site: "https://hivetrace.github.io/docs",
	integrations: [
		starlight({
			title: {
				ru: "Hivetrace Документация",
				en: "Hivetrace Documentation",
			},
			logo: {
				light: "./src/assets/logo-dark.svg",
				dark: "./src/assets/logo-light.svg",
				replacesTitle: true,
			},
			customCss: ["./src/styles/custom.css"],
			defaultLocale: "root",
			locales: {
				root: {
					label: "Русский",
					lang: "ru",
				},
				en: {
					label: "English",
					lang: "en",
				},
			},
			sidebar: [
				{
					label: "Обзор",
					translations: { en: "Overview" },
					items: [
						{
							label: "Что такое HiveTrace?",
							translations: { en: "What is a HiveTrace?" },
							autogenerate: { directory: "overview" },
						},
					],
				},
				{
					label: "Документация",
					translations: { en: "Documentation" },
					autogenerate: { directory: "guides" },
				},
				{
					label: "Интеграция",
					translations: { en: "Integration" },
					items: [
						{
							label: "API",
							translations: { en: "API" },
							autogenerate: { directory: "integration/api" },
						},
						{
							label: "SDK",
							translations: { en: "SDK" },
							items: [
								{
									label: "Обзор",
									translations: {
										en: "Overview",
									},
									link: "integration/sdk/overview",
								},
								{
									label: "Одна LLM",
									translations: {
										en: "Single LLM",
									},
									link: "integration/sdk/single-llm-applications",
								},
								{
									label: "Мультиагенты",
									translations: {
										en: "Multi-Agents",
									},
									autogenerate: {
										directory: "integration/sdk/agents",
									},
								},
							],
						},
						{
							label: "HiveTrace Gateway",
							translations: { en: "HiveTrace Gateway" },
							autogenerate: { directory: "integration/hivetrace-gateway" },
						},
					],
				},
			],
			components: {
				Footer: "./src/components/Footer.astro",
				SocialIcons: "./src/components/Social.astro",
			},
		}),
	],
});
