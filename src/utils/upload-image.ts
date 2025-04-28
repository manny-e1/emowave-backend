import multer from "multer";
import path from "node:path";

export const MAX_UPLOAD_SIZE = 1024 * 1024 * 5;
export const ACCEPTED_FILE_TYPES = ["image/png", "image/jpeg", "image/jpg"];

function checkFileType(
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) {
	const filetypes = /jpeg|jpg|png/;
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype = filetypes.test(file.mimetype);

	if (mimetype && extname) {
		return cb(null, true);
	}
	cb(new Error("invalid file type, only JPEG, JPG, PNG are allowed!"));
}

const storage = multer.diskStorage({
	destination: (_, __, cb) => {
		cb(null, "uploads/");
	},
	filename: (_, file, cb) => {
		cb(
			null,
			`${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
		);
	},
});

export const uploadImage = multer({
	storage: storage,
	limits: { fileSize: MAX_UPLOAD_SIZE },
	fileFilter: (_, file, cb) => {
		checkFileType(file, cb);
	},
});
