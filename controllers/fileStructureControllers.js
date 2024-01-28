const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const fs = require('fs/promises');
const path = require('path');
const fileSystem = require('fs');
const { promisify } = require('util');
const docxConverter = require('docx-pdf');
const imagekit = require('../utils/imagekit');
const multer = require("multer");
const {getSFDT} = require("../utils/helperFunctions");
// const { convertHtml2Docx, convertDocx2Html } = require('../utils/convertDocxToHtml');

const deleteFileImageKit = async (fileId) => {
    const response = await imagekit.deleteFile(fileId);
    if (response) {
        return !!response;
    }
}
const uploadFileImageKit = async (file, fileName, folder) => {
    const response = imagekit.upload(
        {
            file,
            fileName,
            folder
        }
    );
    if (response) {
        return response;
    }
}

// async function getFileStructure(directory, relativePath) {
//     const files = await fs.readdir(directory);
//
//     const fileStructure = [];
//
//     for (const file of files) {
//         const filePath = path.join(directory, file);
//         const stats = await fs.stat(filePath);
//
//
//         const item = {
//             type: stats.isDirectory() ? 'directory' : 'file',
//             name: file,
//             fullPath: path.join(relativePath, file), // Add fullPath property
//         };
//         if (stats.isDirectory()) {
//             item.content = await getFileStructure(filePath, item.fullPath);
//         }
//         fileStructure.push(item);
//
//         // if (stats.isDirectory()) {
//         //     const subFiles = await getFileStructure(filePath);
//         //     fileStructure.push({ type: 'directory', name: file, content: subFiles, fullPath: path.join(relativePath, file) });
//         // } else {
//         //     fileStructure.push({ type: 'file', name: file, fullPath: path.join(relativePath, file) });
//         // }
//     }
//
//     return fileStructure;
// }

async function getImageKitFileStructure(directory="/") {
    const fileList = await imagekit.listFiles({ path: directory, includeFolder: true });
    if (fileList?.length === 0) return [];

    const fileStructure = [];

    for (const file of fileList) {
        const item = {
            type: file.type,
            name: file.name,
            url: file.url,
            fileId: file.fileId,
            filePath: file.filePath,
        };

        if (file.type && file.type === 'folder') {
            item.filePath = file.folderPath;
            item.fileId = file.folderId;
            // const subDirectory = path.join(directory, file.name);
            item.content = []
        }

        fileStructure.push(item);
    }

    return fileStructure;
}


exports.getFileStructure = catchAsync(async (req, res, next) => {
    // const files = await getFileStructure(path.join(__dirname, "..", 'public', "data"), "");
    const { directory } = req.body;
    const files = await getImageKitFileStructure(directory);
    res
        .status(200)
        .json(
            {
                status: "Success",
                data: {
                    files
                }
            }
        )
    ;
})

// exports.getDirectoryStructure = catchAsync(async (req, res, next) => {
//     const { directory } = req.body;
//     const fileList = await getImageKitFileStructure(directory);
//     res
//         .status(200)
//         .json(
//             {
//                 status: "Success",
//                 data: {
//                     fileList
//                 }
//             }
//         )
//     ;
// })

exports.downloadFile = catchAsync(async (req, res, next) => {
    // const filePath = `${__dirname}/../public/data/${req.body.fullPath}`;
    if (fileSystem.existsSync(req.body.fullPath)) {
        // Set the Content-Type header specifically for docx files
        // const fileName = req.body.fullPath;
        // const fileExtension = fileName.split('.').pop().toLowerCase();
        const ext = path.extname(req.body.filename);
        let contentType = 'application/octet-stream'; // Default content type
        if (ext === 'docx') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }

        res.setHeader('Content-Type', contentType);

        // Read the file and send it as a response
        const fileStream = fileSystem.createReadStream(req.body.filePath);
        fileStream.pipe(res);
    } else {
        return next(new AppError(`File requested doesn't exist!`, 400));
    }

    // const filePath = `${__dirname}/../public/data/${req.body.fullPath}`;
    // // Check if the file exists
    // if (fileSystem.existsSync(filePath)) {
    //     // Set the appropriate headers for the response
    //     // res.setHeader('Content-Disposition', `attachment; filename=${req.body.filename}`);
    //     // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); // Set the content type for DOCX files
    //     // res.setHeader('Content-Type', 'application/octet-stream');
    //
    //     // Create a read stream from the file and pipe it to the response
    //     // res.sendFile(filePath);
    //     // const fileStream = fileSystem.createReadStream(filePath);
    //     // fileStream.setEncoding(null);
    //     // fileStream.pipe(res);
    //     res.download(filePath);
    // } else {
    //     return next(new AppError(`File requested doesn't exists!`, 400));
    // }
})

// exports.getExistingFileForEdit = catchAsync(async (req, res, next) => {
//     const { url } = req.query;
//     const htmlString = await convertDocx2Html(decodeURIComponent(url), res, next);
//     res
//         .status(200)
//         .json(
//             {
//                 status: "Success",
//                 data: {
//                     htmlString,
//                 }
//             }
//         )
//     ;
// })

exports.saveFile = catchAsync(async (req, res, next) => {
    const { fileId, filePath } = req.body;
    if (fileId) await deleteFileImageKit(fileId);
    const newPath = filePath?.split("/").slice(0, -1).join('/') || "/"
    const file = fileSystem.readFileSync(req.file.path);
    const response = await uploadFileImageKit(
        file,
        filePath?.split('/').pop().replace(/\.docx[^_]*\.docx/, '.docx') || req.file.originalname,
        newPath
    );
    fs.unlink(req.file.path, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log('File removed');
        }
    })
    // const response = await convertHtml2Docx(fileId, filePath, htmlString);
    if (!response) return next(new AppError(`Error while saving file!`, 400));
    res
        .status(202)
        .json(
            {
                status: "Success",
                data: {
                    url: response.url,
                    filedId: response.fileId,
                    filePath: response.filePath,
                }
            }
        )
    ;
})

exports.convertToSFDT = catchAsync(async (req, res, next) => {
    const fs = require('fs');
    const FormData = require('form-data');
    const axios = require('axios');
    const filePath = 'sampletest.docx';
    const response = await fetch(req.body.url);
    if (!response.ok) return next(new AppError(`Error while converting to SFDT!`, 400));
    // Replace with the actual file path
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await getSFDT(buffer, res, next);
    // const fileData = fs.readFileSync(filePath);
})

exports.convertToWord = catchAsync(async (req, res, next) => {
    const fs = require('fs');
    const axios = require('axios');
    const formObject = {};
    formObject.FileName = req.body.FileName;
    formObject.Content = req.body.Content;
    // formObject.FileName = 'sample.docx';
    // formObject.Content = '{"sfdt":"UEsDBAoAAAAIALSc5VZqhF/FsQIAAF0RAAAEAAAAc2ZkdM1YTY/aMBD9K8i9ogoSCCK3aivUQ1Wt1OOKg53YiVXno45ptov47514nA1hYRe02wCX56/MvJn3sAhbUpRGZvKJ/xSxIaHRGz4mFY9I+LAlgKUm4ZaUNQmDqTcmZUrCxRIGKoMBoHZoHDKHsShJOAEsOA7SmIR+MCbCIZN2mUEm8oPX9zThBOIneQULXzRlMoJ5HhUKFqZjwn/XFhUzkX0Sdx7WOwhi2ZaiocpiXTVoIO0W9pRB1Akic/MU4U8DgJXJGyKFzqiCvEoKtxEJPChtjghzwERQVXFYNwoSkZQrVYzqQquY7Na7NcTHAOtx+4x7xEZyI1E9QU1QlIAj5I4qybSE7BtbYGWwQxT7h1WLpl+fJu4DZxnr4knWi93MMHoz2otPo+6YoL0tIXLBD1Z6C1DyuxqtZG4L0Q6FQ4NlssoCRXDaq7YVXXm/mnTtuM6fx3XUmriT0AiFHGJTo/mchXgusLdAjkCplUORYb4SIU5NppCsQEJRkZVOo7+GqXZoLdLzkYvzvoYdWjF/7FLsxpjxG6exzJPR9KOSvqlScx3sy/R5slhOgyCYTxYLb7KcLTrdCoUy9itx9g/69h99l0lqSOt0bzWfLQPS+Tk48Gx3vu/cvfUjy3hpdDq92tLRXUo19nV6O9y/ckE3yozuqaaJpmU6WhW5eWZ/YrtXxe6wVG8w91xmHu+UefzLBPAHN4932jzX5P6GeVr2/o36wT/lB+/Vnk5X/iLw93rqDe4H/7Qfrsn9TD/MbtQPs5d+kO3vgHO+Y/aHU3t8UD/Mjvnh+tzP9MP8Rv0wP3I/nHPVDqv9/OhdMCjPM3UOblTn4CKduyt0WJ2DC3X+DzzP0JnrjxH5+Kvby7eYl+1zLFpSq6Iw1yflWDQv8qr5DwAQNi1GGaJ200dEmSWVDfsPUEsBAhQACgAAAAgAtJzlVmqEX8WxAgAAXREAAAQAAAAAAAAAAAAAAAAAAAAAAHNmZHRQSwUGAAAAAAEAAQAyAAAA0wIAAAAA"}';
    const headers = {
        'Content-Type': 'application/json;charset=UTF-8',
    };
    axios.post('https://services.syncfusion.com/js/production/api/documenteditor/ExportSFDT', JSON.stringify(formObject), {
        headers, responseType: 'arraybuffer'
    })
        .then((response) => {
            fs.writeFileSync('sample.docx', response.data);
        })
        .catch((error) => {
            console.error('Error:', error.message); // Handle any errors
        });
})


const multerStorage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, `${__dirname}/../public/data/temp`);
        },
        filename: function (req, file, cb) {
            // const fileExtension = path.extname(file.originalname);
            // const filePath = `${__dirname}/../public/data/shipment/${req.params.shipmentId}/${file.originalname}`;
            cb(null, `${file.originalname}.docx`);
        }
    }
)

const multerFilter = (req, file, cb) => {
    // const fileExtension = path.extname(file.originalname);
    // const allowExtension = [".docx", ".doc"];
    // if (allowExtension.includes(fileExtension.toLowerCase())) {
    //     cb(null, true);
    // } else {
    //     cb(new AppError("Incorrect file format", 400), false);
    // }
    cb(null, true);
}

const upload = multer(
    {
        storage: multerStorage,
        fileFilter: multerFilter
    }
)

exports.uploadEditedFile = upload;
