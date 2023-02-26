const express = require("express");
const router = express.Router();
const { Comment } = require("../models/Comment");

//=================================
//             Comment
//=================================

router.post("/saveComment", (req, res) => {
    const comment = new Comment(req.body);
    comment.save((err, comment) => {
        if (err) return res.json({ success: false, err });

        Comment.find({ _id: comment._id })
            .populate("wirter")
            .exec((err, result) => {
                if (err) return res.json({ success: false, err });
                res.status(200).json({ success: true, result });
            });
    });
});

router.get("/getComments", (req, res) => {
    Comment.find({ postId: req.body.videoId })
        .populate("wrtier")
        .exec((err, comments) => {
            if (err) return res.status(400).send(err);
            res.stauts(200).json({ sucess: true, comments });
        });
});

module.exports = router;
