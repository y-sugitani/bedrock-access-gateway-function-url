const PLACEHOLDER_KEY = 'placeholder-key';

const optionKeys = [
  'endpoint',
  'apiKey',
  'modelId',
  'stream',
  'maxTokens',
];
const optionDefaultValues = {
  endpoint: 'http://localhost:11434/v1',
  apiKey: '',
  modelId: 'llama3.2:1b',
  stream: true,
  maxTokens: 512,
};

const getOptions = () => {
  const options = localStorage.getItem('options');
  if (options) {
    return JSON.parse(options);
  }
  return optionDefaultValues;
}

const listModelsButton = document.getElementById('listModels');
listModelsButton.addEventListener('click', async () => {
  listModelsButton.style.display = 'none';
  const select = document.createElement('select');
  const modelIdInput = document.getElementById('modelId');
  modelIdInput.style.display = 'none';
  modelIdInput.parentNode.appendChild(select);

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.innerText = 'Loading...';
  select.appendChild(placeholderOption);

  const { endpoint, apiKey } = getOptions();
  const response = await fetch(`${endpoint}/models`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const resposneData = await response.json();
  const modelIds = resposneData.data.map(({ id }) => id);

  modelIds.forEach((modelId) => {
    const option = document.createElement('option');
    option.value = modelId;
    option.innerText = modelId;
    select.appendChild(option);
  });

  placeholderOption.remove();

  select.addEventListener('change', () => {
    const options = getOptions();
    options.modelId = select.value;
    setOptions(options);
    modelIdInput.style.display = 'block';
    listModelsButton.style.display = 'inline-block';
    select.remove();
  });
});

const renderChat = () => {
  if (window.chat) {
    window.chat.remove();
  }

  const chat = document.createElement('deep-chat');
  chat.style = 'width: 100%; max-width: 640px;';

  const { endpoint, apiKey, modelId, stream, maxTokens } = getOptions();

  chat.connect = { stream };
  chat.directConnection = {
    openAI: {
      key: apiKey || PLACEHOLDER_KEY,
      chat: {
        max_tokens: maxTokens,
        model: modelId,
        system_prompt: 'You are very helpful assistant bot.'
      }
    }
  };
  chat.history = JSON.parse(localStorage.getItem('history') || '[]');

  chat.onMessage = ({ message, isHistory }) => {
    if (message.role === 'user') {
      chat._activeService.rawBody.stream = stream;
      chat._activeService.rawBody.model = modelId;
      const url = `${endpoint}/chat/completions`;
      chat._activeService.url = url;
      chat._activeService.keyVerificationDetails.url = url;
      chat._activeService.keyVerificationDetails.method = 'POST';
      chat._activeService.connectSettings.headers.Authorization = `Bearer ${apiKey}`;
      chat._activeService.connectSettings.headers;
    }
    if (!isHistory) localStorage.setItem('history', JSON.stringify(chat.getMessages()));
  };

  chat.requestInterceptor = (requestDetails) => {
    const { stream } = getOptions();
    requestDetails.body.stream = stream;
    return requestDetails;
  };

  const setChatHeight = () => {
    chat.style.height = `calc(100vh - 84px - ${chat.offsetTop}px)`;
  }

  chat.onComponentRender = setChatHeight;
  chat.errorMessages = {
    displayServiceErrorMessages: true,
  };

  document.getElementById('chat-container').appendChild(chat);

  window.chat = chat;
  window.addEventListener('resize', setChatHeight);
};

const setOptions = (newOptions, reRender = true) => {
  optionKeys.forEach((key) => {
    const value = newOptions[key];
    document.getElementById(key).value = value;
  });
  localStorage.setItem('options', JSON.stringify(newOptions));
  if (reRender) renderChat();
}

optionKeys.forEach((key) => {
  const input = document.getElementById(key);
  input.addEventListener('input', () => {
    const options = getOptions();
    let { value } = input;
    if (key === 'stream') {
      value = input.checked;
    } else if (key === 'maxTokens') {
      value = parseInt(value, 10);
    }
    options[key] = value;
    setOptions(options);
  });
});

const initOptions = () => {
  // Prefill values from URL query strings if they exists
  const urlParams = new URLSearchParams(window.location.search);
  const options = getOptions();
  optionKeys.forEach((key) => {
    const value = urlParams.get(key) || options[key];
    options[key] = value;
  });
  setOptions(options, false);
};

initOptions();

document.getElementById('reset').addEventListener('click', () => {
  setOptions(optionDefaultValues);
});
document.getElementById('clear').addEventListener('click', () => {
  localStorage.setItem('history', '[]');
  window.chat.clearMessages();
  renderChat();
});

renderChat();
