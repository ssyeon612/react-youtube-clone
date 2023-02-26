const express = require("express");
const router = express.Router();
const { Video } = require("../models/Video");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const { Subscriber } = require("../models/Subscriber");

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

router.post("/getVideoDetail", (req, res) => {
    Video.findOne({ _id: req.body.videoId })
        .populate("writer")
        .exec((err, videoDetail) => {
            if (err) return res.status(400).send(err);
            return res.status(200).json({ success: true, videoDetail });
        });
});

router.post("/thumbnail", (req, res) => {
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

router.post("/uploadVideo", (req, res) => {
    // 비디오 정보 저장
    const video = new Video(req.body);
    video.save((err, doc) => {
        if (err) return res.json({ success: false, err });
        res.status(200).json({ success: true });
    });
});

router.post("/getSubscriptionVideos", (req, res) => {
    // 구독하는 사람들 찾기
    Subscriber.find({ userFrom: req.body.userFrom }).exec((err, subscriberInfo) => {
        if (err) return res.status(400).send(err);

        let subscribedUser = [];
        subscriberInfo.map((subscriber, i) => {
            subscribedUser.push(subscriber.userTo);
        });

        // 비디오 가져오기
        Video.find({ writer: { $in: subscribedUser } })
            .populate("writer")
            .exec((err, videos) => {
                if (err) return res.status(400).send(err);
                res.status(200).json({ success: true, videos });
            });
    });
});

module.exports = router;
