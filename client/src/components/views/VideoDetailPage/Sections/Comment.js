import React, { useState } from "react";
import Axios from "axios";
import { useSelector } from "react-redux";
import SingleComment from "./SingleComment";

function Comment(props) {
    const videoId = props.postId;
    const user = useSelector((state) => state.user);
    const [CommentValue, setCommentValue] = useState("");

    const handleClick = (event) => {
        setCommentValue(event.currentTarget.value);
    };

    const onSubmit = (event) => {
        event.preventDefault();

        const variables = {
            content: CommentValue,
            writer: user.userData._id,
            postId: videoId,
        };

        Axios.post("/api/comment/saveComment", variables).then((response) => {
            if (response.data.success) {
                console.log(response.data.result);
                setCommentValue("")
                props.refreshFunction(response.data.result);
            } else {
                alert("코멘트를 저장하지 못했습니다.");
            }
        });
    };

    return (
        <div>
            <br />
            <p>Replies</p>
            <hr />

            {/* Comment List */}

            {props.commentLists && props.commentLists.map((comment, index) => <SingleComment refreshFunction={props.refreshFunction} comment={comment} postId={videoId} />)}

            {/* Root Comment Form */}

            <form style={{ display: "flex" }} onSubmit={onSubmit}>
                <textarea style={{ width: "100%", borderRadius: "5px" }} onChange={handleClick} value={CommentValue} placeholder="코멘트를 작성해주세요." />
                <br />
                <button onClick={onSubmit}>Submit</button>
            </form>
        </div>
    );
}

export default Comment;
