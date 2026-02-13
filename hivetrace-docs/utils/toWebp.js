import { readdir, readFile, unlink } from "node:fs/promises";
import sharp from "sharp";

const DIR_PATH = "./src/assets/img/";
const fileTypes = ["jpeg", "jpg", "png"];

async function convertToWebp() {
	try {
		const fileNames = await readdir(DIR_PATH, { withFileTypes: true });

		fileNames.forEach(async (file) => {
			const isFile = file.isFile();
			const splittedFileType = file.name.split(".");
			const fileType = splittedFileType[splittedFileType.length - 1];
			const fileName = splittedFileType
				.slice(0, splittedFileType.length - 1)
				.join(".");
			const filePath = `${DIR_PATH}/${file.name}`;

			if (isFile && fileTypes.includes(fileType)) {
				const buffer = await readFile(filePath);

				await sharp(buffer)
					.resize({ width: 1440 })
					.webp({ quality: 85 })
					.toFile(`${DIR_PATH}/${fileName}.webp`)
					.then(() => {
						unlink(filePath);
					});
			}
		});
		console.log("✓ DONE");
	} catch (err) {
		console.error(err);
	}
}

convertToWebp();
