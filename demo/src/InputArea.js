import React, { useRef, useState, useCallback, useEffect, createContext, useContext } from 'react';
import { get_combined_relevant_documents } from './Opensearch';
//import { sumDoc, handleDocs } from './App';
import { Response, Question, RephrasedQuestion } from './Response';
import { ResponseContainer } from './ResponseContainer';
import { makePrompt, question_prompt } from './PromptEngineer';
import { useComponentContext } from './output-container';
import { handleDocs } from './DocList';
import { SettingContext, port } from './App';
//Controls the flow of the input, sends requests out to APIs, and sends info to all the other classes


/**
 * 
 * @param {*String} query 
 * @param {*List of Documents from OS} docs 
 * @param {* List of interactions} conversation 
 * @param {* String} SYS_PROMPT 
 * @param {* INT} mport 
 * @param {* String} model 
 * @returns Response
 */
const getResponse = async (query, docs, conversation, SYS_PROMPT, mport, model = 'gpt-3.5-turbo', max_tokens) => {
  const baseURL = `http://localhost:${mport}/v1`
  const prompts = makePrompt(docs, conversation, query, SYS_PROMPT)
  let l = 0
  prompts.OpenAIPrompt.forEach((element) => console.log((l += ((element.content).length / 4))));
  var json = {
    stream: true,
    model: model,
    messages: prompts.OpenAIPrompt,
    temperature: 0,
  }
  if (max_tokens) {
    json.max_tokens = max_tokens
  }
  console.log(json)
  const chatJson = JSON.stringify(json)
  const fetchres = fetch(
    `${baseURL}/chat/completions`,
    { body: chatJson, method: 'POST', headers: { "Content-Type": "application/json" } })
  return fetchres;
}
const getQuestion = async (query, conversation) => {
  const prompt = question_prompt(query, conversation)
  const chatJson = JSON.stringify({
    stream: true,
    model: "gpt-3.5-turbo",
    messages: prompt,
    max_tokens: query.length,
    temperature: 0,
  })
  const baseURL = `http://localhost:${port}/v1`
  return fetch(
    `${baseURL}/chat/completions`,
    { body: chatJson, method: 'POST', headers: { "Content-Type": "application/json" } })
}

/* Here is the below for the code above:
1. We use the useRef hook to create a ref to the textarea element.
2. We use the useState hook to create a piece of state for the text input.
3. We create a function that adjusts the height of the textarea based
on the scrollHeight value.
4. We create a function that resets the height of the textarea to 32px
(1 row) and then sets the input text to the new text.
5. We create an event handler that calls the adjustTextAreaHeight
function whenever the value of the textarea changes.
6. We create an event handler that calls the resetTextAreaHeight
function whenever the value of the textarea changes.
7. We create a useEffect hook that focuses the textarea on mount.
8. We render the textarea and pass the ref and event handlers. */
export const InputArea = (props) => {
  const { setDocs, setOutputList, conversation, setConversation, streaming, setStreaming, docListRef, SettingDialogRef } = props;
  const inputTextAreaRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [docsFinished, setDocsFinished] = useState(false);
  const curDocsFinished = useRef(docsFinished);
  const [rephrasingFinished, setRephrasingFinished] = useState("");
  const finishedRef = useRef(rephrasingFinished);
  const { settings, setSettings } = useContext(SettingContext);
  const numDocs = settings.numDocs;
  const resetTextAreaHeight = useCallback((text) => {
    const textarea = inputTextAreaRef.current;
    textarea.style.height = '32px'; // Start with 1 row
    textarea.style.overflowY = 'hidden';
    setInputText(text);
  }, []);
  useEffect(() => {
    finishedRef.current = rephrasingFinished;
  }, [rephrasingFinished]);
  useEffect(() => {
    setRephrasingFinished('');
  }, [docsFinished]);

  const adjustTextAreaHeight = useCallback(() => {
    const textarea = inputTextAreaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    if (textarea.scrollHeight > 160) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  }, []);
  //This is the function that is called when the user submits a query
  //We can use this to send the query to the backend
  //We can send a object with e.target.value as the query, and e.persist() as an empty function, and we can stimulate the whole operation
  //Useful for tests?
  /**
   * @param {Event} e
   * @returns {void}
   * @description This function is called when the user submits a query. It sends the query to the backend and then calls handleDocs to handle the documents
   */
  //TODO: Make this function more readable
  //TODO: implement a way to stop the reader
  //TODO implement setStreaming
  //TODO make settings, call LLama or not, wait for checks or not. Also want to hide the buttons if LLama is not called, and Docs are not checked
  const handleSubmit = useCallback(async (e) => {
    //takes in the target value, some reason why but inputText immediatly goes blank when this is called
    //Send input to a new Question and Response class. Response then streams answer to itself
    e.persist();
    setDocsFinished(false);
    setInputText(e.target.value)
    const newInputText = e.target.value
    const query = (key) => <Question query={newInputText} key={key}></Question>;
    setOutputList((prevOutput) => [query(prevOutput.length), ...prevOutput]);
    const QuestionResponse = await getQuestion(newInputText, conversation)
    const Qreader = QuestionResponse.body.getReader()
    var newQuery = newInputText
    //Wait until this is called to continue
    const onDone = (output) => {
      setRephrasingFinished(output);
      newQuery = output;
    }
    const rephrasedQuestion = (key) => <RephrasedQuestion
      reader={Qreader}
      index={key}
      setStreaming={setStreaming}
      query={newInputText}
      setConversation={setConversation}
      onDone={onDone}
      key={key}
    >                 </RephrasedQuestion>;
    setOutputList((prevOutput) => [rephrasedQuestion(prevOutput.length), ...prevOutput]);
    //Reset the text box
    resetTextAreaHeight('');
    //A function that returns a promise, that only resolves once onDone is called
    const waitForRephrasing = () => {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (finishedRef.current !== '') {
            clearInterval(interval);
            resolve(finishedRef.current);
          }
        }, 100);
      });
    };
    const countTrues = (arr) => {
      return arr.reduce((count, value) => count + Boolean(value), 0);
    };
    const waitFor7checks = (n) => {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (countTrues(docListRef.current.checkedList) >= n) {
            clearInterval(interval);
            resolve(docListRef.current.checkedList);
          }
        }, 100);
      });
    };
    const rephrased = await waitForRephrasing();
    if (rephrased !== newQuery || rephrased !== finishedRef.current || newQuery !== finishedRef.current || rephrased === newInputText) {
      console.warn(rephrased, newQuery, finishedRef.current, "Rephrasing error")
    }
    const documents = await get_combined_relevant_documents(rephrased, settings.index);
    const handled = await handleDocs(documents, curDocsFinished);
    setDocs(handled)
    const min = Math.min(numDocs, documents.length);
    const waitForDocs = await waitFor7checks(min);
    if (waitForDocs !== docListRef.current.checkedList || countTrues(waitForDocs) !== min) {
      console.warn(waitForDocs, docListRef.current.checkedList, "Docs error")
    }
    //THE LLAMA MODEL REQUESTS ARE CURRENTLY COMMENTED OUT TO TEST THE DEMO WITH ONLY OPENAI
    setDocsFinished(true);
    docListRef.current.reset();
    const sentDocs = documents.filter((obj, index) => docListRef.current.checkedList[index]);
    console.log("sending")
    const [APIresponse, APIresponse2] = await Promise.all([
      getResponse(newInputText, sentDocs, conversation, settings.SYS_PROMPT, settings.OAport),
      (settings.useLLama ? getResponse(newInputText, sentDocs, conversation, settings.SYS_PROMPT, settings.LLMPort, "sharpbai/Llama-2-13b-chat-hf", settings.max_tokens) : null)
    ]);
    console.log("sent")
    const readers = [APIresponse.body.getReader()]
    if (settings.useLLama) {
      const reader2 = APIresponse2.body.getReader()
      readers.push(reader2)
    }
    var names = ['OpenAI']
    if (settings.useLLama) {
      names.push('LLama')
    }


    const response = (key) => {
      console.log("response")
      return (<ResponseContainer
        readers={readers}//, reader2]}
        names={names}//, 'LLama']}
        index={key}
        setStreaming={setStreaming}
        query={newInputText}
        setConversation={setConversation}
        key={key}
      >                 </ResponseContainer>);
    }
    setOutputList((prevOutput) => [response(prevOutput.length), ...prevOutput]);
    // Add the response first, then the query to reverse the order
  }, [docListRef, setOutputList, conversation, setDocs, resetTextAreaHeight, setStreaming, setConversation]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event); // Trigger form submission
    }
    else if (event.key === "Tab" && event.shiftKey) {
      console.log("open")
      SettingDialogRef.current.show();
    }
  }, [handleSubmit]);


  const handleChange = useCallback((e) => {
    e.persist(); // Persist the synthetic event
    setInputText(e.target.value);
    adjustTextAreaHeight();
  }, [adjustTextAreaHeight])


  useEffect(() => {
    inputTextAreaRef.current.focus();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="input-form">
      <textarea
        ref={inputTextAreaRef}
        value={inputText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask me anything..."
        rows="1"
      />
    </form>
  );
};