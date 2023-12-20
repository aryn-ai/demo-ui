const SOURCES = ["type", "_id", "doc_id", "properties", "title", "text_representation", "bbox"]
// const SEARCH_PIPELINE = "ga-demo-pipeline-hybrid"
const SEARCH_PIPELINE = "hybrid_rag_pipeline"
const NO_RAG_SEARCH_PIPELINE = "hybrid_pipeline"
export const FEEDBACK_INDEX_NAME = "feedback"

export const hybridConversationSearchNoRag = async (rephrasedQuestion: string, filters: any, index_name: string, model_id: string) => {
    let query =
    {
        "_source": SOURCES,
        "query": {
            "hybrid": {
                "queries": [
                    {
                        "bool": {
                            "must": [
                                {
                                    "exists": {
                                        "field": "text_representation"
                                    }
                                },
                                {
                                    "match": {
                                        "text_representation": rephrasedQuestion
                                    }
                                }
                            ],
                            "filter": [
                                {
                                    "match_all": {}
                                }]
                        }
                    },
                    {
                        "neural": {
                            "embedding": {
                                "query_text": rephrasedQuestion,
                                "k": 100,
                                "model_id": model_id,
                                "filter":
                                {
                                    "match_all": {}
                                }
                            }
                        }
                    }
                ]
            }
        },
        "size": 20,
        "ext": {
            "rerank": {
                "query_context": {
                    "query_text": rephrasedQuestion
                }
            }
        }
    }
    if (filters != null) {
        if (query.query.hybrid.queries && query.query.hybrid.queries.length > 0 && query.query.hybrid.queries[0].bool) {
            query.query.hybrid.queries[0].bool.filter = filters
        }
        if (query.query.hybrid.queries && query.query.hybrid.queries.length > 0 && query.query.hybrid.queries[1].neural) {
            query.query.hybrid.queries[1].neural.embedding.filter = filters
        }
    }
    const url = "/opensearch/" + index_name + "/_search?search_pipeline=" + NO_RAG_SEARCH_PIPELINE
    return openSearchCall(query, url)
}

export const hybridConversationSearch = async (question: string, rephrasedQuestion: string, filters: any, conversationId: string, index_name: string, embeddingModel: string, llmModel: string, numDocs: number = 7) => {
    const query =
    {
        "_source": SOURCES,
        "query": {
            "hybrid": {
                "queries": [
                    {
                        "bool": {
                            "must": [
                                {
                                    "exists": {
                                        "field": "text_representation"
                                    }
                                },
                                {
                                    "term": {
                                        "text": {
                                            "value": rephrasedQuestion,
                                            "boost": 1
                                        }
                                    }
                                }
                            ],
                            "filter": [
                                {
                                    "match_all": {}
                                }
                            ]
                        }
                    },
                    {
                        "neural": {
                            "embedding": {
                                "query_text": rephrasedQuestion,
                                "k": 100,
                                "model_id": embeddingModel,
                                "filter":
                                {
                                    "match_all": {}
                                }
                            }
                        }
                    }
                ]
            }
        },
        "ext": {
            "generative_qa_parameters": {
                "llm_question": question,
                "conversation_id": conversationId,
                "context_size": numDocs,
                "llm_model": llmModel,
            },
            "rerank": {
                "query_context": {
                    "query_text": rephrasedQuestion
                }
            }
        },
        "size": 20
    }
    if (filters != null) {
        if (query.query.hybrid.queries && query.query.hybrid.queries.length > 0 && query.query.hybrid.queries[0].bool) {
            query.query.hybrid.queries[0].bool.filter = filters
        } else {
            console.log("Filters 1 were undefined")
        }
        if (query.query.hybrid.queries && query.query.hybrid.queries.length > 0 && query.query.hybrid.queries[1].neural) {
            query.query.hybrid.queries[1].neural.embedding.filter = filters
        } else {
            console.log("Filters 2 were undefined")
        }
    } else {
        console.log("Filters were null")
    }
    const url = "/opensearch/" + index_name + "/_search?search_pipeline=" + SEARCH_PIPELINE

    return openSearchCall(query, url)
}

export const updateInteractionAnswer = async (interactionId: any, answer: string) => {
    console.log("Updating interaction with new answer", interactionId)
    const url = "/opensearch/_plugins/_ml/memory/interaction/" + interactionId + "/_update"
    const data = {
        "response": answer
    }
    return openSearchCall(data, url, "PUT")
}

export const getIndices = async () => {
    const url = "/opensearch/_aliases?pretty"
    return openSearchNoBodyCall(url)
}
export const getEmbeddingModels = async () => {
    const body = {
        "query": {
            "bool": {
                "must_not": {
                    "range": {
                        "chunk_number": {
                            "gte": 0
                        }
                    }
                },
                "must": [
                    { "term": { "algorithm": "TEXT_EMBEDDING" } },
                    { "term": { "model_state": "DEPLOYED" } }
                ]
            }
        }
    }
    const url = "/opensearch/_plugins/_ml/models/_search"
    return openSearchCall(body, url)
}
export const createConversation = async (conversationId: string) => {
    const body = {
        "name": conversationId
    }
    const url = "/opensearch/_plugins/_ml/memory/conversation/_create"
    return openSearchCall(body, url)
}
export const getInteractions = async (conversationId: any) => {
    const url = "/opensearch/_plugins/_ml/memory/conversation/" + conversationId + "/_search"
    const body = {
        "query": {
            "match_all": {}
        },
        "sort": [
            {
                "create_time": {
                    "order": "DESC"
                }
            }
        ]
    }
    return openSearchCall(body, url)
}
export const getConversations = () => {
    const url = "/opensearch/_plugins/_ml/memory/conversation/_list"
    return openSearchNoBodyCall(url)
}
export const deleteConversation = async (conversation_id: string) => {
    // hack for empty conversation delete:
    console.log("Going to delete", conversation_id)
    const url = "/opensearch/_plugins/_ml/memory/conversation/" + conversation_id + "/_delete"

    const body = {
        input: "",
        prompt_template: "",
        response: ""
    }
    console.log("Adding interaction")
    const addCall = await openSearchCall(body, url)
    await addCall

    console.log("Now deleting")
    return openSearchNoBodyCall(url, "DELETE")
}
export const openSearchNoBodyCall = async (url: string, http_method: string = "GET") => {
    try {
        console.log("sending ", http_method + " " + url)
        const response = await fetch(url, {
            method: http_method,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`OpenSearchRequest rejected with status ${response.status} and message ${text}`);
            })
        }

        const data = await response.json();
        console.log('Response data:', data);
        return data;
    } catch (error: any) {
        console.error('Error sending query:', error);
        throw new Error("Error making OpenSearch query to " + url + " without body: " + error.message);
    }
}
export const openSearchCall = async (query: any, url: string, http_method: string = "POST") => {
    try {
        console.log("sending request", url, JSON.stringify(query))
        const response = await fetch(url, {
            method: http_method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query),
        });
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Request to ${url}:\n` + JSON.stringify(query) + `\nrejected with status ${response.status} and message ${text}`);
            })
        }

        const data = await response.json();
        console.log('Response data:', data);
        return data;
    } catch (error: any) {
        console.error('Error sending query:', error);
        throw new Error("Error making OpenSearch to " + url + " query with body: " + error.message);
    }
}


// Legacy for local RAG
export const sendQuery = async (query: any, index_name: string) => {
    const url = "/opensearch/" + index_name + `/_search/`;
    return openSearchCall(query, url)
}

export async function queryOpenSearch(question: string, index_name: string, model_id: string) {
    const query = {
        "query": {
            "bool": {
                "should": [
                    {
                        "function_score": {
                            "query": {
                                "match": {
                                    "text_representation": question
                                }
                            },
                            "weight": 0.925
                        }
                    },
                    {
                        "neural": {
                            "embedding": {
                                "query_text": question,
                                "model_id": model_id,
                                "k": 20
                            }
                        }
                    }
                ]
            }
        },
        "size": 10,
        "_source": SOURCES
    }
    console.log("OS question ", question)
    console.log("OS query ", JSON.stringify(query))
    var response = sendQuery(query, index_name);
    return response;
}

export const createFeedbackIndex = async () => {
    const indexMappings = {
        "mappings": {
            "properties": {
                "interaction_id": {
                    "type": "keyword"
                },
                "thumb": {
                    "type": "keyword"
                },
                "conversation_id": {
                    "type": "keyword"
                },
                "comment": {
                    "type": "text"
                }
            }
        }
    }
    openSearchCall(indexMappings, "/opensearch/" + FEEDBACK_INDEX_NAME, "PUT")
}

export const updateFeedback = async (conversationId: string, interactionId: string, thumb: boolean | null, comment: string | null) => {
    var feedbackDoc;
    console.log(thumb);
    if (comment !== "") {
        feedbackDoc = {
            "doc": {
                "interaction_id": interactionId,
                "conversation_id": conversationId,
                "thumb": (thumb === null ? "null" : (thumb ? "up" : "down")),
                "comment": comment
            },
            "doc_as_upsert": true
        }
    } else {
        feedbackDoc = {
            "doc": {
                "interaction_id": interactionId,
                "conversation_id": conversationId,
                "thumb": (thumb === null ? "null" : (thumb ? "up" : "down"))
            },
            "doc_as_upsert": true
        }
    }
    const url = "/opensearch/" + FEEDBACK_INDEX_NAME + "/_update/" + interactionId
    openSearchCall(feedbackDoc, url, "POST")
}

export const getFeedback = async (interactionId: string) => {
    const url = "/opensearch/" + FEEDBACK_INDEX_NAME + "/_doc/" + interactionId
    return openSearchNoBodyCall(url)
}