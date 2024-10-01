import { } from './firebase_config.js';

function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                resolve(userEmail);
            } else {
                console.log("Nenhum usuário autenticado.");
                reject("Nenhum usuário autenticado.");
            }
        });
    });
}
    document.addEventListener('DOMContentLoaded', async function () {
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'pt-br',
            initialView: 'dayGridMonth',
            customButtons: {
                addEventButton: {
                    text: 'Adicionar evento',
                    click: function () {
                        modal.style.display = "block";
                    }
                }
            },
            eventClick: function (info) {
                info.jsEvent.preventDefault();

                var modal = document.getElementById("eventModal");
                modal.style.display = "block";

                // Defina o título do evento
                document.getElementById("eventTitle").textContent = info.event.title;

                document.getElementById("eventDetails").innerHTML = `
                <div class="event-details">
                    <p><strong>Morador:</strong> ${info.event.extendedProps.morador || "Não especificado"}</p>
                    <p><strong>Status:</strong> ${info.event.extendedProps.status || "Não especificado"}</p>
                    <p><strong>Local:</strong> ${info.event.extendedProps.local || "Não especificado"}</p>
                    <p><strong>Tipo:</strong> ${info.event.extendedProps.tipo || "Não especificado"}</p>
                    <p><strong>Início:</strong> ${info.event.start ? info.event.start.toLocaleString() : "Não especificado"}</p>
                    <p><strong>Fim:</strong> ${info.event.end ? info.event.end.toLocaleString() : "Não especificado"}</p>
                </div>
            `;

                var span = document.getElementsByClassName("close")[0];
                span.onclick = function () {
                    modal.style.display = "none";
                };

                window.onclick = function (event) {
                    if (event.target == modal) {
                        modal.style.display = "none";
                    }
                };
            },
            fixedWeekCount: false,
            headerToolbar: {
                left: 'prev,next',
                right: 'today',
                center: 'title'
            },
            dayMaxEventRows: 2,
            buttonText: {
                today: 'Hoje',
            },
            events: function (fetchInfo, successCallback, failureCallback) {
                fetchEvents(fetchInfo, successCallback, failureCallback);
            },
            eventContent: function (arg) {
                return {
                    html: `
                    <div class="event-title">${arg.event.title}</div>
                `
                };
            }
        });

        calendar.render();

        async function fetchEvents(fetchInfo, successCallback, failureCallback) {
            const userEmail = await getEmail();
            const userDb = firebase.firestore().collection('condominio');
            const sindico = await userDb.where('email', '==', userEmail).get();
            const sindicoData = sindico.docs[0].data();
            const codigoSindico = sindicoData.cod_Condominio;

            firebase.firestore().collection("eventos-manutencao")
                .where("cod_condominio", "==", codigoSindico)
                .onSnapshot(snapshot => {
                    const eventos = snapshot.docs
                        .map(doc => {
                            const data = doc.data();
                            const status = data.status;

                            if (status === 'Cancelado') {
                                return null;
                            }

                            return {
                                id: doc.id,
                                title: data.titulo,
                                start: data.data_inicio.toDate(),
                                end: data.data_fim.toDate(),
                                classNames: [getClassByStatus(status)],
                                extendedProps: {
                                    tipo: data.tipo,
                                    local: data.local,
                                    status: data.status,
                                    morador: data.morador,
                                    valor: 'R$ ' + (data.valor / 100).toFixed(2).replace('.', ',')
                                }
                            };
                        })
                        .filter(event => event !== null); // Remove eventos cancelados

                    successCallback(eventos);
                });
        }

        function getClassByStatus(status) {
            switch (status) {
                case 'Reservado':
                    return 'fc-event-green';
                case 'Aguardando pagamento':
                    return 'fc-event-orange';
                case 'Manutenção':
                    return 'fc-event-grey';
                case 'Evento':
                    return 'fc-event-red';
                default:
                    return 'fc-event-grey';
            }
        }
    });