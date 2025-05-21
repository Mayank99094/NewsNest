import React from "react";

const NewsItem = (props) => {
  const { title, description, imageUrl, newsUrl, author, date, source } = props;

  const speakText = () => {
    const text = `${title}. ${description || ""}`;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="card my-3">
      <img
        src={imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
        className="card-img-top"
        alt="News"
      />
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{description}</p>
        <p className="card-text">
          <small className="text-muted">
            By {author || "Unknown"} on {new Date(date).toGMTString()}
          </small>
        </p>
        <p className="card-text">
          <small className="badge bg-info">{source}</small>
        </p>
        <a
          href={newsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-primary"
        >
          Read More
        </a>
        <button onClick={speakText} className="btn btn-sm btn-secondary mx-2">
          Listen
        </button>
      </div>
    </div>
  );
};

export default NewsItem;
