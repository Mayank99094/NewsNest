/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import NewsItem from "./NewsItem";
import { BarLoader } from "react-spinners";
import PropTypes from "prop-types";
import InfiniteScroll from "react-infinite-scroll-component";

const VoiceSearch = ({ onSearch }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API not supported in this browser.");
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onstart = () => setListening(true);
    recognitionRef.current.onend = () => setListening(false);

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onSearch(transcript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };
  }, [onSearch]);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <button
      onClick={toggleListening}
      style={{
        backgroundColor: listening ? "red" : "green",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        marginBottom: "10px",
        cursor: "pointer",
      }}
    >
      {listening ? "Listening..." : "🎤 Voice Search"}
    </button>
  );
};

const News = (props) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const updateNews = async () => {
    setLoading(true);
    setError(null);

    const baseUrl = searchQuery
      ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&apiKey=${props.apikey}&page=${page}&pageSize=${props.pageSize}`
      : `https://newsapi.org/v2/top-headlines?country=${props.country}&category=${props.category}&apiKey=${props.apikey}&page=${page}&pageSize=${props.pageSize}`;


    try {
      let response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      let data = await response.json();

      if (data.status !== "ok") {
        throw new Error(data.message || "Error fetching news");
      }

      // If no articles found for top-headlines, try fallback everything endpoint (only on page 1)
      if (data.totalResults === 0 && page === 1 && !searchQuery) {
        const fallbackUrl = `https://newsapi.org/v2/everything?q=${props.category || "latest"
          }&apiKey=${props.apikey}&page=1&pageSize=${props.pageSize}`;
        let fallbackResponse = await fetch(fallbackUrl);
        let fallbackData = await fallbackResponse.json();
        if (fallbackData.status === "ok" && fallbackData.totalResults > 0) {
          setArticles(fallbackData.articles);
          setTotalResults(fallbackData.totalResults);
        } else {
          setArticles([]);
          setTotalResults(0);
          setError("No news articles found for this category.");
        }
      } else {
        // On first page replace articles, otherwise append
        if (page === 1) {
          setArticles(data.articles);
        } else {
          setArticles((prevArticles) => [...prevArticles, ...data.articles]);
        }
        setTotalResults(data.totalResults);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.message);
      setArticles([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, props.country, props.category, props.apikey, props.pageSize, searchQuery]);

  const fetchMoreData = () => {
    setPage((prevPage) => prevPage + 1);
  };

  // Text-to-Speech for article reading
  const readArticle = (title, description) => {
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(
      `${title}. ${description || ""}`
    );
    synth.speak(utterance);
  };

  return (
    <div className="container my-3">
      <h1 className="text-center">
        NewsNest - Top {capitalizeFirstLetter(props.category)} Headlines
      </h1>

      {/* Voice Search Button */}
      <VoiceSearch
        onSearch={(query) => {
          setSearchQuery(query);
          setPage(1);
        }}
      />

      {/* Text input search fallback */}
      <input
        type="text"
        placeholder="Type to search or use voice search"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setPage(1);
        }}
        style={{ width: "100%", padding: "10px", marginBottom: "20px" }}
      />

      {error && <p className="text-danger text-center">{error}</p>}

      {!error && (
        <InfiniteScroll
          dataLength={articles.length}
          next={fetchMoreData}
          hasMore={articles.length < totalResults}
          loader={<BarLoader color="#36D7B7" width={"100%"} loading={loading} />}
        >
          <div className="container">
            <div className="row">
              {articles.map((element, index) => (
                <div className="col-md-4 mb-2" key={index}>
                  <NewsItem
                    title={element.title || ""}
                    description={element.description || ""}
                    imageUrl={
                      element.urlToImage
                        ? element.urlToImage
                        : "https://images.indianexpress.com/2024/04/stalin-sonia_09527e.jpg?w=640"
                    }
                    newsUrl={element.url}
                    author={element.author}
                    date={element.publishedAt}
                    source={element.source.name}
                  />
                  {/* Listen button */}

                </div>
              ))}
            </div>
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
};

News.defaultProps = {
  country: "in",
  pageSize: 6,
  category: "business",
};

News.propTypes = {
  country: PropTypes.string,
  pageSize: PropTypes.number,
  category: PropTypes.string,
  apikey: PropTypes.string.isRequired,
};

export default News;
