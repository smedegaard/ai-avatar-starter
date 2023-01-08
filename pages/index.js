import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import buildspaceLogo from '../assets/buildspace-logo.png';

const Home = () => {
  const [input, setInput] = useState('');
  const [img, setImg] = useState('');
  const maxRetries = 20;
  // number of seconds  of retries 
  const [wait_sec, setWait_sec] = useState(0);
  // Number of retries left
  const [retryCount, setRetryCount] = useState(maxRetries);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWarmingUp, setisWarmingUp] = useState(false);

  const [countDownValue, setCountDownValue] = useState(0);

  const onChange = (event) => {
    setInput(event.target.value);
  };


  const generateAction = async () => {
    console.log('Generating...');
    setisWarmingUp(false);
    setIsGenerating(true);

    // Add this check to make sure there is no double click
    if (isGenerating && wait_sec === 0) return;
    // If this is a retry request, take away retryCount
    if (wait_sec > 0) {
      setRetryCount((prevState) => {
        if (prevState === 0) {
          return 0;
        } else {
          return prevState - 1;
        }
      });

      setWait_sec(0);
    }

    // Add the fetch request
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: JSON.stringify({ input }),
    });

    const data = await response.json();

    // If model still loading, drop that retry time
    if (response.status === 503) {
      // Set the estimated_time property in state
      setisWarmingUp(true);
      setWait_sec(data.estimated_time);
      setCountDownValue(data.estimated_time);
      // Set loading has started

      return;
    }

    // If another error, drop error
    if (!response.ok) {
      console.log(`Error: ${data.error}`);
      // Stop loading
      setIsGenerating(false);
      setisWarmingUp(false);

      return;
    }

    // Set image data into state property
    setImg(data.image);
    // Everything is all done -- stop loading!
    setIsGenerating(false);
    setisWarmingUp(false);

    return;
  };

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  // Add useEffect here
  useEffect(() => {
    const runRetry = async () => {
      if (retryCount === 0) {
        console.log(`Model still loading after ${maxRetries} retries. Try request again in 5 minutes.`);
        setRetryCount(maxRetries);
        return;
      }

      console.log(`Trying again in ${wait_sec} seconds.`);

      await sleep(wait_sec * 1000);

      await generateAction();
    };

    if (wait_sec === 0) {
      return;
    }

    runRetry();
  }, [wait_sec]);

  useEffect(() => {
    console.info(countDownValue);

    if (countDownValue != 0) {

      const timer = setTimeout(() => {
        setCountDownValue(countDownValue - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    setRetryCount(retryCount - 1);

  }, [countDownValue]);

  return (
    <div className="root">
      <Head>
        <title>Smedegaard Generator | buildspace</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>Smedegaard generator</h1>
          </div>
          <div className="header-subtitle">
            <h2>Make fancy pictures with me</h2>
          </div>
          <div className="prompt-container">
            <input className="prompt-box" value={input} onChange={onChange} />
            <div className="prompt-buttons">
              <a
                className={isGenerating ? "generate-button disabled" : "generate-button"}
                disabled={isGenerating}
                onClick={generateAction}
              >
                <div className="generate">
                  <p>Generate</p>
                </div>
              </a>
            </div>
            <div className={isGenerating ? 'loader' : 'hidden'} style={{ margin: 'auto 6px' }}></div>
            <div className={isWarmingUp ? 'warming-up-message' : 'hidden'}>
              <div>The model is warming up. Kick back and wait. We'll try again in</div>
              <div style={{ margin: 'auto 6px' }}> {countDownValue} </div>
              <div>seconds 🤙 </div>
              <div style={{ width: '100%', textAlign: 'center' }}>We'll quit at retry {maxRetries}. This is attempt {wait_sec}</div>
            </div>
          </div>

        </div>
        {/* Add output container */}
        {img && (
          <div className="output-content">
            <Image src={img} width={512} height={512} alt={input} />
            <p>{input}</p>
          </div>
        )}
      </div>

      <div className="badge-container grow">
        <a
          href="https://buildspace.so/builds/ai-avatar"
          target="_blank"
          rel="noreferrer"
        >
          <div className="badge">
            <Image src={buildspaceLogo} alt="buildspace logo" />
            <p>build with buildspace</p>
          </div>
        </a>
      </div>
    </div >
  );
};

export default Home;
