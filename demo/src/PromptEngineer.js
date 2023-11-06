
export const SUM_PROMPT = "You are a helpful assistant that answers the users question as accurately taking into context an enumerated list of search results. You cite search results using [${number}] notation. \ Do not cite anything that isn't in the search results.  Do not repeat yourself. \If there are any necessary steps or procedures in your answer, enumerate them. If there is information provided in the conversation, use it SEARCH RESULTS: [SEAC_R]"
export const makePrompt = (docs, conversation, query, SYS_PROMPT = SUM_PROMPT ) =>{
    var SearchResults = ''
    const stringDoc = (docu, i) => {
      const doc = docu._source
      var string = `${i + 1} Title : ${doc.title}\n${doc.text}`
      return string
    }
  docs.forEach((element, index) => {
      SearchResults = SearchResults + (stringDoc(element, index) + "\n")
  });
    const SystemPrompt = SYS_PROMPT.replace("[SEAC_R]", SearchResults);
    const OpenAIPrompt = [{role : "system", content : SystemPrompt}, ...conversation, {role : "user", content: 'User question: ' + query}]
    var LlamaPrompt = ''
    LlamaPrompt = getPrompt(query, createDoubleObjects(conversation), SystemPrompt);
    
    const LLamaJson = JSON.stringify({
      model: "sharpbai/Llama-2-13b-chat-hf",
      prompt: "LlamaPrompt",
      temperature: 0.6,
      max_tokens: 150,
      stream: true,
    });
    
    function getPrompt(message, chatHistory, systemPrompt) {
        const texts = [`<s>[INST] <<SYS>>\n${systemPrompt}\n<</SYS>>\n\n`];
        let doStrip = false;
        //console.log(typeof chatHistory)
        try {
          for (const {userInput, response} of chatHistory) {
            console.log(chatHistory)
            const strippedUserInput = doStrip ? userInput.content.trim() : userInput;
            doStrip = true;
            texts.push(`${strippedUserInput} [/INST] ${response.content.trim()} </s><s>[INST] `);
          }
        } catch (error) {
          console.error(chatHistory, "" + error)
        }
        
      
        const strippedMessage = doStrip ? message.trim() : message;
        texts.push(`${strippedMessage} [/INST]`);
      
        return texts.join('');
      }
      
      
      function createDoubleObjects(list) {
        const doubleObjectsList = [];
      
        // Iterate over the list of objects in pairs of two
        for (let i = 0; i < list.length; i += 2) {
          const user = list[i];
          const assistant = i + 1 < list.length ? list[i + 1] : null;
      
          const doubleObject = { user, assistant };
          doubleObjectsList.push(doubleObject);
        }
      
        return doubleObjectsList;
      }
    return {json : LLamaJson, prompt : LlamaPrompt, OpenAIPrompt : OpenAIPrompt};
      

}
export const summarization_prompt = (text) => {
  const prompt = "Summarize this text without explaining yourself: \n" + text + "\n\nSummary:"
  return prompt;
}
export const question_prompt = (text, conversation) => {
  const sys = "You are a helpful assistant that takes the conversation into context and rephrases sentences by request correcting grammar and spelling mistakes. This question will be fed into a query search engine. \n"
  const prompt = "Rephrase this question: \n" + text + "Rephrased Question:"
  const OpenAIPrompt =[{role : "system", content : sys}, ...conversation, {role: "user", content : prompt}]
  return OpenAIPrompt;
}
export const sendInteraction = (setConversation, query, output) => {
    const addInteraction = async (setConversation) =>
    {
        const nextInteraction = [{role : "user", content: query}, {role: "assistant",content : output }]
        const interaction = nextInteraction;
        setConversation((prevOutput) => prevOutput.concat(interaction))
        }
        

    addInteraction(setConversation)
}