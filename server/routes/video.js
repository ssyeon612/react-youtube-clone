const express = require("express");
const router = express.Router();
const { Video } = require("../models/Video");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");

// STORAGE MULTER CONFIG
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        if (ext !== ".mp4") {
            return cb(res.status(400).end("only mp4 is allowed"), false);
        }
        cb(null, true);
    },
});

const upload = multer({ storage: storage }).single("file");

//=================================
//             Video
//=================================

router.post("/uploadfiles", (req, res) => {
    // 비디오를 서버에 저장
    upload(req, res, (err) => {
        if (err) {
            return res.json({ success: false, err });
        }
        return res.json({ success: true, url: res.req.file.path, fileName: res.req.file.filename });
    });
});

router.post("/uploadVideo", (req, res) => {
    // 비디오 정보 저장
    const video = new Video(req.body);
    video.save((err, doc) => {
        if (err) return res.json({ success: false, err });
        res.status(200).json({ success: true });
    });
});

router.get("/getVideos", (req, res) => {
    // DB에서 비디오 정보 호출
    // populate를 해야 모든 정보 호출 가능
    Video.find()
        .populate("writer")
        .exec((err, videos) => {
            if (err) return res.status(400).send(err);
            res.status(200).json({ success: true, videos });
        });
});

router.post("/thumbnail", (req, res) => {
    console.log("thumbnail::");
    // 썸네일 생성하고 비디로 러닝타임 가져오기
    let filePath = "";
    let fileDuration = "";
    // 비디오 정보 가져오기
    ffmpeg.ffprobe(req.body.url, function (err, metadata) {
        console.dir(metadata); // all metadata
        console.log(metadata.format.duration);
        fileDuration = metadata.format.duration;
    });

    // 썸네일 생성
    ffmpeg(req.body.url)
        .on("filenames", function (filenames) {
            console.log("will generate" + filenames.join(","));
            console.log(filenames);

            filePath = "uploads/thumbnails/" + filenames[0];
        })
        .on("end", function () {
            console.log("screenshots taken");
            return res.json({ success: true, url: filePath, fileDuration: fileDuration });
        })
        .on("error", function (err) {
            console.log(err);
            return res.json({ success: false, err });
        })
        .screenshots({
            // will take screenshots at 20%, 40%, 60% and 80% of the video
            count: 3,
            folder: "uploads/thumbnails",
            size: "320x240",
            // '%b' : input basename (filename w/o extension)
            filename: "thumbnail=%b.png",
        });
});

module.exports = router;
