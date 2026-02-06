import { readFileSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

const projectRoot = resolve(import.meta.dir, "..");
const packageJsonPath = resolve(projectRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;
const name = packageJson.name;

// Detect platform
const platform =
	process.platform === "darwin"
		? "macos"
		: process.platform === "win32"
			? "windows"
			: "linux";
const ext = platform === "windows" ? ".exe" : "";

console.log(`Building ${name} v${version} for ${platform}...`);

try {
	// Typecheck
	console.log("Running typecheck...");
	execSync("bun run typecheck", { cwd: projectRoot, stdio: "inherit" });

	// Build SPA
	console.log("Building SPA...");
	execSync("bun run build", { cwd: projectRoot, stdio: "inherit" });

	// Create dist/bin directory
	console.log("Creating dist/bin directory...");
	const distPath = resolve(projectRoot, "dist/bin");
	if (!existsSync(distPath)) {
		mkdirSync(distPath, { recursive: true });
	}

	// Build executable
	const outputFile = `dist/bin/${name}-v${version}-${platform}${ext}`;
	console.log(`Compiling to ${outputFile}...`);
	execSync(
		`bun build --compile packages/server/src/index.ts --outfile ${outputFile}`,
		{ cwd: projectRoot, stdio: "inherit" },
	);

	// Create a latest copy
	const latestFile = `dist/bin/${name}-latest-${platform}${ext}`;
	console.log(`Creating latest copy...`);
	copyFileSync(
		resolve(projectRoot, outputFile),
		resolve(projectRoot, latestFile),
	);

	console.log(`✓ Build complete!`);
	console.log(`  Versioned: ${outputFile}`);
	console.log(`  Latest:    ${latestFile}`);
} catch (error) {
	console.error("Build failed:", error);
	process.exit(1);
}
