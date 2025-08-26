document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente carregado e analisado.");

    // ===================================
    // ELEMENTOS DO DOM
    // ===================================
    const timeDisplay = document.getElementById('time');
    const timeCallDisplay = document.getElementById('time-call');
    const numberDisplay = document.getElementById('number-display');
    const keypadButtons = document.querySelectorAll('#dialer-screen .keypad-btn');
    const inCallKeypadButtons = document.querySelectorAll('#in-call-keypad .keypad-btn');
    const callBtn = document.getElementById('call-btn');
    const endCallBtn = document.getElementById('end-call-btn');
    const backspaceBtn = document.getElementById('backspace-btn');
    const dialerScreen = document.getElementById('dialer-screen');
    const callScreen = document.getElementById('call-screen');
    const callingNumberDisplay = document.getElementById('calling-number');
    const callTimerDisplay = document.getElementById('call-timer');
    const dtmfDisplay = document.getElementById('dtmf-display');
    const apiStatusCall = document.getElementById('call-api-status');
    const inCallKeypad = document.getElementById('in-call-keypad');

    const callingMusic = document.getElementById('calling-music');
    const audioIntro = document.getElementById('audio-intro');
    const audioWhatsapp = document.getElementById('audio-whatsapp');
    const audioError = document.getElementById('audio-error');
    const allAudios = [callingMusic, audioIntro, audioWhatsapp, audioError];

    let currentNumber = '';
    let callTimerInterval;
    let isCallActive = false;
    let ivrState = 'inactive';

    const API_ENDPOINT_WHATSAPP = 'https://http.msging.net/commands';
    
    // ==========================================================
    // NOVA LÓGICA CENTRALIZADA DE TECLADO FÍSICO
    // ==========================================================
    function handleGlobalKeyPress(event) {
        // Se uma chamada está ativa, a tecla vai para a lógica da URA
        if (isCallActive) {
            handleInCallKeyPress(event);
        } 
        // Se não, a tecla vai para a lógica de discagem
        else {
            handleDialerKeyPress(event);
        }
    }

    function handleDialerKeyPress(event) {
        const key = event.key;
        // Permite digitar números, * e #
        if (/^[0-9*#]$/.test(key)) {
            if (currentNumber.length < 15) {
                currentNumber += key;
                updateDialerDisplay();
            }
        }
        // Permite usar o Enter para ligar
        else if (key === 'Enter') {
            event.preventDefault(); // Impede o comportamento padrão do Enter
            if (currentNumber.length > 0) {
                callBtn.click(); // Simula o clique no botão de ligar
            }
        }
        // Bônus: Permite usar o Backspace para apagar
        else if (key === 'Backspace') {
            currentNumber = currentNumber.slice(0, -1);
            updateDialerDisplay();
        }
    }
    
    // Antiga função 'handleKeyPress', agora mais específica para a URA
    function handleInCallKeyPress(event) {
        const key = event.key;
        if (!isCallActive || !/^[0-9*#]$/.test(key)) return;
        
        console.log(`Tecla processada: ${key}, Estado da URA: ${ivrState}`);
        
        dtmfDisplay.textContent = key;
        dtmfDisplay.style.opacity = '1';
        setTimeout(() => { dtmfDisplay.style.opacity = '0'; }, 500);

        switch (ivrState) {
            case 'main_menu':
                stopAllAudios();
                if (['1', '2', '3'].includes(key)) startWhatsappPrompt();
                else handleInvalidOption();
                break;
            case 'whatsapp_prompt':
                stopAllAudios();
                if (key === '1') triggerWhatsappApi();
                else if (key === '2') handleEndCall();
                else handleInvalidOption();
                break;
        }
    }

    // Adiciona o listener de teclado UMA VEZ para o documento inteiro
    document.addEventListener('keydown', handleGlobalKeyPress);
    // ==========================================================

    function updateTime() {
        const now = new Date();
        const timeString = now.toTimeString().substring(0, 5);
        timeDisplay.textContent = timeString;
        timeCallDisplay.textContent = timeString;
    }
    setInterval(updateTime, 1000);
    updateTime();

    function updateDialerDisplay() {
        numberDisplay.textContent = currentNumber;
        backspaceBtn.classList.toggle('hidden', currentNumber.length === 0);
    }
    
    function stopAllAudios() {
        allAudios.forEach(audio => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
                audio.onended = null;
            }
        });
    }

    function playAudio(audioElement) {
        if (!audioElement) return;
        stopAllAudios();
        audioElement.play().catch(e => console.error("Erro ao tocar áudio:", e));
    }

    function startIntroMenu() {
        console.log("URA: Iniciando menu principal.");
        ivrState = 'main_menu';
        inCallKeypad.classList.remove('hidden');
        playAudio(audioIntro);
    }

    function startWhatsappPrompt() {
        console.log("URA: Iniciando menu WhatsApp.");
        ivrState = 'whatsapp_prompt';
        playAudio(audioWhatsapp);
    }
    
    function handleInvalidOption() {
        console.log("URA: Opção inválida selecionada.");
        ivrState = 'inactive';
        playAudio(audioError);
        audioError.onended = () => {
            if (isCallActive) startIntroMenu();
        };
    }
    
    async function triggerWhatsappApi() {
        console.log("URA: Acionando API do WhatsApp...");
        apiStatusCall.textContent = 'Enviando para o WhatsApp...';
        ivrState = 'inactive';
        const numeroCompleto = `+55${currentNumber}`;
        const numero = currentNumber.replace(/\D/g, ''); // Remove tudo que não for dígito
        if (numero.length === 13 && numero.startsWith('55')) {
                // Já tem o DDI, só retorna com +
               var numfin = `+${numero}`;
            }

            if (numero.length === 11) {
                // Não tem DDI, adiciona 55 na frente
               var numfin = `+55${numero}`;
            }
        const randomId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const payload = {
                "id": randomId,
                "to": "postmaster@activecampaign.msging.net",
                "method": "set",
                "uri": "/campaign/full",
                "type": "application/vnd.iris.activecampaign.full-campaign+json",
                "resource": {
                    "campaign": {
                    "name": "[CALL DEFLACTION]- " + randomId,
                    "campaignType": "Individual",
                    "flowId": "96fe3041-7853-4d47-a5b6-2d53cd448429",
                    "stateId": "4b97cffa-d6ba-4741-a04f-ff6b39ad0993",
                    "masterstate": "maintelecom@msging.net"
                    },
                    "audience": {
                    "recipient": numfin,
                    "messageParams": {
                        "0":"https://blipmediastore.blob.core.windows.net/public-medias/Media_894f6d5f-25a2-4d48-8531-af68d017b960"
                     }
                    },
                    "message": {
                     "messageTemplate": "deflaction",
			         "channelType": "WHATSAPP",
			         "messageTemplateLanguage": "pt_BR",
			         "messageParams": [
				        "0"
			         ]
                    }
                }
                };
        try {
            const response = await fetch(API_ENDPOINT_WHATSAPP, {
                method: 'POST',
                headers: {'Authorization': 'Key cm90ZWFkb3JzbWFydGxhYjpmUXV6eDNOcUpmZ01qVnB5UGNUUA==','Content-Type': 'application/json',},
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
            apiStatusCall.textContent = 'Mensagem enviada!';
        } catch (error) {
            apiStatusCall.textContent = 'Erro no envio.';
        } finally {
            setTimeout(() => { if(isCallActive) handleEndCall(); }, 2000);
        }
    }
    
    function handleCall() {
        if (currentNumber.length === 0) return;
        isCallActive = true;
        dialerScreen.classList.add('hidden');
        callScreen.classList.remove('hidden');
        callingNumberDisplay.textContent = currentNumber;
        callTimerDisplay.textContent = 'chamando...';
        playAudio(callingMusic);
        setTimeout(() => {
            if (!isCallActive) return;
            startCallTimer();
            startIntroMenu();
        }, 3000);
        // Não precisamos mais adicionar/remover o listener aqui
    }
    
    function handleEndCall() {
        if (!isCallActive) return;
        console.log("Executando handleEndCall...");
        isCallActive = false;
        ivrState = 'inactive';
        inCallKeypad.classList.add('hidden');
        stopAllAudios();
        stopCallTimer();
        currentNumber = '';
        updateDialerDisplay();
        apiStatusCall.textContent = '';
        dtmfDisplay.textContent = '';
        callScreen.classList.add('hidden');
        dialerScreen.classList.remove('hidden');
        // Não precisamos mais adicionar/remover o listener aqui
    }

    // Listeners de cliques (continuam funcionando normalmente)
    keypadButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentNumber.length < 15) {
                currentNumber += button.dataset.value;
                updateDialerDisplay();
            }
        });
    });

    inCallKeypadButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Reutiliza a mesma lógica do teclado físico!
            const fakeEvent = { key: button.dataset.value };
            handleInCallKeyPress(fakeEvent);
        });
    });

    backspaceBtn.addEventListener('click', () => {
        currentNumber = currentNumber.slice(0, -1);
        updateDialerDisplay();
    });

    callBtn.addEventListener('click', handleCall);
    endCallBtn.addEventListener('click', handleEndCall);

    let seconds = 0;
    function startCallTimer() {
        seconds = 0;
        updateTimerDisplay();
        callTimerInterval = setInterval(() => {
            seconds++;
            updateTimerDisplay();
        }, 1000);
    }
    
    function stopCallTimer() {
        clearInterval(callTimerInterval);
        callTimerDisplay.textContent = 'chamada encerrada';
    }

    function updateTimerDisplay() {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        callTimerDisplay.textContent = `${mins}:${secs}`;
    }
});