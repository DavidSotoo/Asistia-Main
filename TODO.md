# TODO: Prepare Backend for Student Photo URLs

- [x] Modify Backend/prisma/schema.prisma to add photoUrl: String? to the Student model
- [x] Modify Backend/server.js to serve static files from Backend/uploads/photos
- [x] Execute npx prisma generate

# TODO: Implement Photo Upload Endpoint

- [x] Install multer dependency
- [x] Create Backend/controllers/uploadController.js with multer config and uploadPhoto function
- [x] Create Backend/routes/upload.js with POST /photo route
- [x] Update Backend/server.js to import and mount upload routes at /api/upload
- [x] Start database with docker-compose
- [x] Test successful upload with valid auth and image file
- [x] Test error cases: no auth, invalid token, no file, invalid file type
- [x] Verify file storage in uploads/photos/ and correct photoUrl response
- [x] Confirm static file serving for uploaded photos
