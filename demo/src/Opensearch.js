var protocol = "http";
var port = 9200;
var host = "localhost"
const OS_URL_BASE = protocol + "://" + host + ":" + port + "/"
var index_name = "benchmark-beta-demo";
const balance_factor = 1.0 / 8.0;
const NUM_DOCS_TO_RETRIEVE = 20
//DOES ALL THE CALLS TO GET HYBRID SEARCH. SIMILAR TO OSRETRIEVER.PY
export const get_combined_relevant_documents = async (query, index = index_name) => {
  var max_match_score = (0)
  var max_neural_score = (0)
  const sendQuery = async (query, score) => {
    const url = OS_URL_BASE + index + `/_search`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      console.log('Response data:', data, JSON.stringify(query));
      
      return {hits : data.hits, max_score : data.hits.max_score}
    } catch (error) {
      console.error('Error sending query:', error);
      // Handle errors here, e.g., display an error message to the user.
      return 0;
    }
  }
  const Promisematch = sendQuery(keyword_q(query, max_match_score), { maxScore: max_match_score });
  const Promiseneural = sendQuery(neural_q(query), { maxScore: max_neural_score });
  const [match, neural] = await Promise.all([Promisematch, Promiseneural]);
  max_neural_score = neural.max_score
  max_match_score = match.max_score
  const keyword_weight = balance_factor * (max_neural_score / max_match_score)
  let max_score = 0;
  const data = await sendQuery(combined_q(query, keyword_weight), max_score)
  return data.hits.hits
}
export const neural_q = (query) =>{
  const neural_query = {
    "query": {
        "bool":{
            "must":[
                {
                "neural":{
                    "text_embedding":{
                    "query_text": query,
                    "model_id":"88YKiokBrJE01ZdT2eWx",
                    "k":20
                    }
                }
                }
            ]
        }
    },
    "size": 1,
    "_source": ["text","title","summary","url"]
  }
  return neural_query
}
export const keyword_q = (query) => {
  const keword = { "query": {
      "match": {
      "text": query
      }
  },
  "size": 1,
  "_source": ["text","title","summary","url"]
  } 
  return keword
}
export const combined_q = (query, keyword_weight) => {
  const combined_query = {
    "query": {
        "bool": {
            "must": [
                {
                    "function_score": {
                        "query": {
                            "match": {
                                "text": query
                            }
                        },
                        "weight": keyword_weight
                    }
                },
                {
                    "neural": {
                        "text_embedding": {
                            "query_text": query,
                            "model_id":"88YKiokBrJE01ZdT2eWx",
                            "k":100
                        }
                    }
                }
            ]
        }
    },
    "size": NUM_DOCS_TO_RETRIEVE,
    "_source": ["text","title","summary","url", "boxes"]
    
}
return combined_query
}
export const sendQuery = async (query) => {
  console.log("sending" + query)
  const url = OS_URL_BASE + index_name + `/_search`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data.max_score;
  } catch (error) {
    console.error('Error sending query:', error);
    // Handle errors here, e.g., display an error message to the user.
    return null;
  }

}












