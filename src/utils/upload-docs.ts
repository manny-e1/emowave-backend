import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";

export const MAX_UPLOAD_SIZE = 1024 * 1024 * 5;
export const ACCEPTED_FILE_TYPES = [
	"text/csv",
	"text/plain",
	"application/pdf",
	"application/octet-stream",
];

function checkFileType(
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) {
	const filetypes = /csv|txt|pdf/;
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype = ACCEPTED_FILE_TYPES.includes(file.mimetype);

	if (mimetype && extname) {
		return cb(null, true);
	}
	cb(new Error("invalid file type, only csv, txt and pdf files are allowed!"));
}

const storage = multer.diskStorage({
	destination: async (_, __, cb) => {
		const uploadPath = "uploads/docs";
		try {
			await fs.access(uploadPath);
		} catch (error) {
			await fs.mkdir(uploadPath, { recursive: true });
		}
		cb(null, uploadPath);
	},
	filename: (req, file, cb) => {
		cb(
			null,
			`${path.parse(file.originalname).name}*${Date.now()}${path.extname(file.originalname)}`,
		);
	},
});

export const uploadAndSaveDocs = multer({
	storage: storage,
	limits: { fileSize: MAX_UPLOAD_SIZE },
	fileFilter: (_, file, cb) => {
		checkFileType(file, cb);
	},
});
export const uploadDocs = multer({
	limits: { fileSize: MAX_UPLOAD_SIZE },
	fileFilter: (_, file, cb) => {
		checkFileType(file, cb);
	},
});
