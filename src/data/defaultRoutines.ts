import { Task, ChoicePair, Alarm } from "../types";

export const AUTISM_DEFAULT_TASKS: Task[] = [
  {
    id: "task_brush_teeth",
    title: "Escovar os Dentes",
    description: "Higiene bucal completa para dentes limpinhos e hálito fresco.",
    durationMinutes: 5,
    iconName: "Smile",
    steps: [
      { id: "brush_1", title: "Pegar a escova e o creme dental: Pegar a escova e colocar creme dental na escova", completed: false },
      { id: "brush_2", title: "Escovar os dentes da frente: Com movimentos suaves (ou de 'bolinha'), escove os dentes da frente enquanto a mamãe conta até 5", completed: false },
      { id: "brush_3", title: "Escovar os dentes do fundo (lados): Escove a parte de trás", completed: false },
      { id: "brush_4", title: "Escovar a parte de trás dos dentes", completed: false },
      { id: "brush_5", title: "Limpar a língua e cuspir: Passe a escova na língua e pode cuspir o excesso de espuma na pia", completed: false },
      { id: "brush_6", title: "Lavar e guardar: Lave a boca e a escova", completed: false }
    ]
  },
  {
    id: "task_breakfast",
    title: "Tomar Café da Manhã",
    description: "Refeição matinal saborosa para começar o dia cheio de energia.",
    durationMinutes: 15,
    iconName: "Coffee",
    steps: [
      { id: "bf_1", title: "Passo 1: Sentar na cadeira perto da mesa da cozinha", completed: false },
      { id: "bf_2", title: "Passo 2: Pegar a fruta, suco ou leite", completed: false },
      { id: "bf_3", title: "Passo 3: Dizer ou apontar quando não quiser mais", completed: false }
    ]
  },
  {
    id: "task_change_clothes",
    title: "Trocar de Roupa",
    description: "Guardar o pijama confortável e escolher a roupa do dia!",
    durationMinutes: 10,
    iconName: "Shirt",
    steps: [
      { id: "clothes_1", title: "Dobrar e guardar o pijama no lugar certo", completed: false },
      { id: "clothes_2", title: "Escolher a camiseta, calça, saia, bermuda ou vestido que mais gosta", completed: false },
      { id: "clothes_3", title: "Calçar as meias bem esticadinhas", completed: false },
      { id: "clothes_4", title: "Colocar os tênis e fechar bem", completed: false }
    ]
  },
  {
    id: "task_go_to_school",
    title: "Ir para a Escola",
    description: "Organização e saída tranquila para um dia de aprendizado.",
    durationMinutes: 15,
    iconName: "BookOpen",
    steps: [
      { id: "school_1", title: "Uniforme da escola", completed: false },
      { id: "school_2", title: "Pentear os cabelos", completed: false },
      { id: "school_3", title: "Mochila", completed: false },
      { id: "school_4", title: "Garrafa de água", completed: false },
      { id: "school_5", title: "Entrar no carro ou ônibus", completed: false }
    ]
  },
  {
    id: "task_after_school",
    title: "Após a Escola",
    description: "Chegada em casa, troca de uniforme e organização dos pertences.",
    durationMinutes: 10,
    iconName: "Sparkles",
    steps: [
      { id: "aft_1", title: "Tire a parte de cima do uniforme", completed: false },
      { id: "aft_2", title: "Tire a parte de baixo do uniforme", completed: false },
      { id: "aft_3", title: "Guardar a mochila e sapatos no lugar certo", completed: false },
      { id: "aft_4", title: "Vestir uma roupa confortável de ficar em casa", completed: false }
    ]
  },
  {
    id: "task_lunch",
    title: "Almoço",
    description: "Refeição completa do meio-dia com tranquilidade e postura à mesa.",
    durationMinutes: 20,
    iconName: "Utensils",
    steps: [
      { id: "lunch_1", title: "Passo 1: Sentar na cadeira perto da mesa da cozinha", completed: false },
      { id: "lunch_2", title: "Passo 2: Pegar a colher ou garfo e colocar no prato", completed: false },
      { id: "lunch_3", title: "Passo 3: Comer a comida principal", completed: false },
      { id: "lunch_4", title: "Passo 4: Dizer 'estou satisfeito' quando não quiser mais", completed: false },
      { id: "lunch_5", title: "Passo 5: Deixar o garfo ou colher no prato quando acabar", completed: false },
      { id: "lunch_6", title: "Passo 6: Comer a sobremesa ou tomar suco", completed: false }
    ]
  },
  {
    id: "task_therapy",
    title: "Terapia",
    description: "Sessão de desenvolvimento com o(a) terapeuta (imagem do local ou nome).",
    durationMinutes: 45,
    iconName: "Heart",
    steps: [
      { id: "ther_1", title: "Separar o material ou brinquedo para a sessão", completed: false },
      { id: "ther_2", title: "Ir ao local da terapia ou encontrar o(a) terapeuta", completed: false },
      { id: "ther_3", title: "Realizar as atividades propostas com calma e alegria", completed: false },
      { id: "ther_4", title: "Guardar os materiais e comemorar o progresso", completed: false }
    ]
  },
  {
    id: "task_free_play",
    title: "Brincadeira Livre",
    description: "Momento de autonomia para criar, explorar e se divertir.",
    durationMinutes: 30,
    iconName: "Gamepad2",
    steps: [
      { id: "play_1", title: "Escolher o brinquedo ou jogo favorito", completed: false },
      { id: "play_2", title: "Brincar no seu próprio ritmo com alegria", completed: false },
      { id: "play_3", title: "Guardar os brinquedos na caixa ou estante ao terminar", completed: false }
    ]
  },
  {
    id: "task_wash_hands",
    title: "Lavar as Mãos",
    description: "Higienização correta das mãos com água e sabonete.",
    durationMinutes: 3,
    iconName: "Droplets",
    steps: [
      { id: "wash_1", title: "Abrir a torneira", completed: false },
      { id: "wash_2", title: "Molhar as mãos: Abra a torneira e molhe as mãos com água corrente", completed: false },
      { id: "wash_3", title: "Aplicar o sabonete: Coloque quantidade suficiente de sabonete na palma de uma mão", completed: false },
      { id: "wash_4", title: "Ensaboar as mãos: Com o sabonete, esfregue uma mão na outra", completed: false },
      { id: "wash_5", title: "Esfregar o dorso: Esfregue a parte de cima de cada uma das mãos", completed: false },
      { id: "wash_6", title: "Fechar a torneira", completed: false },
      { id: "wash_7", title: "Enxugar as mãos na toalha ou papel", completed: false }
    ]
  },
  {
    id: "task_dinner",
    title: "Jantar",
    description: "Alimentação noturna agradável em família.",
    durationMinutes: 20,
    iconName: "Utensils",
    steps: [
      { id: "din_1", title: "Passo 1: Sentar na cadeira perto da mesa da cozinha", completed: false },
      { id: "din_2", title: "Passo 2: Pegar a colher ou garfo e colocar no prato", completed: false },
      { id: "din_3", title: "Passo 3: Comer a comida principal", completed: false },
      { id: "din_4", title: "Passo 4: Dizer ou apontar quando não quiser mais", completed: false },
      { id: "din_5", title: "Passo 5: Deixar o garfo ou colher no prato quando acabar", completed: false },
      { id: "din_6", title: "Passo 6: Comer a sobremesa ou tomar suco", completed: false }
    ]
  },
  {
    id: "task_turn_off_screens",
    title: "Desligar Telas",
    description: "Transição suave para desligar TV, tablet ou celular antes de dormir.",
    durationMinutes: 5,
    iconName: "Moon",
    steps: [
      { id: "screen_1", title: "Ouvir o aviso de que o tempo de tela está acabando", completed: false },
      { id: "screen_2", title: "Pausar o vídeo ou jogo com tranquilidade", completed: false },
      { id: "screen_3", title: "Desligar a TV, tablet ou celular", completed: false },
      { id: "screen_4", title: "Guardar o aparelho no lugar seguro", completed: false }
    ]
  },
  {
    id: "task_bath",
    title: "Banho",
    description: "Passo a passo completo e estruturado para o banho relaxante.",
    durationMinutes: 20,
    iconName: "ShowerHead",
    steps: [
      { id: "bath_1", title: "Preparar a toalha e roupas limpas", completed: false },
      { id: "bath_2", title: "Abrir o chuveiro", completed: false },
      { id: "bath_3", title: "Molhar o corpo inteiro", completed: false },
      { id: "bath_4", title: "Pegar o shampoo e colocar na palma da mão", completed: false },
      { id: "bath_5", title: "Passar no cabelo e enxaguar", completed: false },
      { id: "bath_6", title: "Pegar condicionador e colocar na palma da mão", completed: false },
      { id: "bath_7", title: "Passar no cabelo", completed: false },
      { id: "bath_8", title: "Lavar e enxaguar", completed: false },
      { id: "bath_9", title: "Lavar com água o rosto", completed: false },
      { id: "bath_10", title: "Passar sabonete nos braços e axilas", completed: false },
      { id: "bath_11", title: "Retirar com água do chuveiro", completed: false },
      { id: "bath_12", title: "Passar sabonete na barriga e retirar com água do chuveiro", completed: false },
      { id: "bath_13", title: "Passar sabonete nas partes íntimas", completed: false },
      { id: "bath_14", title: "Retirar com água do chuveiro", completed: false },
      { id: "bath_15", title: "Passar sabonete nas pernas", completed: false },
      { id: "bath_16", title: "Retirar com água do chuveiro", completed: false },
      { id: "bath_17", title: "Apoiar na parede e passar sabonete no pé", completed: false },
      { id: "bath_18", title: "Retirar com água do chuveiro", completed: false },
      { id: "bath_19", title: "Apoiar na parede e passar sabonete no outro pé", completed: false },
      { id: "bath_20", title: "Retirar com água do chuveiro", completed: false },
      { id: "bath_21", title: "Desligar o chuveiro", completed: false },
      { id: "bath_22", title: "Pegar a toalha para enxugar o cabelo", completed: false },
      { id: "bath_23", title: "Enxugar o corpo com toalha", completed: false },
      { id: "bath_24", title: "Vestir a calcinha/cueca", completed: false },
      { id: "bath_25", title: "Vestir o pijama (parte de cima)", completed: false },
      { id: "bath_26", title: "Vestir o pijama (parte de baixo)", completed: false }
    ]
  },
  {
    id: "task_sleep",
    title: "Deitar para Dormir",
    description: "Preparação para uma noite de sono reconfortante e tranquila.",
    durationMinutes: 20,
    iconName: "Moon",
    steps: [
      { id: "sleep_1", title: "Deitar na cama confortavelmente", completed: false },
      { id: "sleep_2", title: "Cobrir com o cobertor quentinho", completed: false },
      { id: "sleep_3", title: "Leitura de historinha ou música suave", completed: false },
      { id: "sleep_4", title: "Fechar os olhos, respirar fundo e relaxar", completed: false }
    ]
  },
  {
    id: "task_rest_time",
    title: "Horário de Descansar",
    description: "Momento de desaceleração e pausa sensorial definido pelos pais.",
    durationMinutes: 15,
    iconName: "Heart",
    steps: [
      { id: "rest_1", title: "Ir para o cantinho de descanso calmo e aconchegante", completed: false },
      { id: "rest_2", title: "Realizar a atividade tranquila definida pelos pais (relaxar, respirar ou deitar)", completed: false },
      { id: "rest_3", title: "Descansar a mente e recarregar as energias", completed: false }
    ]
  },
  {
    id: "task_snack",
    title: "Lanche",
    description: "Pausa saudável para um lanchinho saboroso.",
    durationMinutes: 10,
    iconName: "Coffee",
    steps: [
      { id: "snack_1", title: "Lavar as mãos antes de comer", completed: false },
      { id: "snack_2", title: "Sentar à mesa e saborear o lanche com calma", completed: false },
      { id: "snack_3", title: "Limpar a boca e levar o pratinho/copo para a pia", completed: false }
    ]
  },
  {
    id: "task_homework",
    title: "Tarefa de Casa",
    description: "Desenvolvimento escolar organizado passo a passo.",
    durationMinutes: 25,
    iconName: "BookOpen",
    steps: [
      { id: "hw_1", title: "Pegar caderno, lápis, lápis de cor e borracha", completed: false },
      { id: "hw_2", title: "Abrir o caderno ou apostila", completed: false },
      { id: "hw_3", title: "Ler o que a professora pediu com atenção", completed: false },
      { id: "hw_4", title: "Fazer a atividade número 1", completed: false },
      { id: "hw_5", title: "Fazer a atividade número 2", completed: false },
      { id: "hw_6", title: "Fazer a atividade por ordem numérica até terminar", completed: false },
      { id: "hw_7", title: "Fechar o caderno", completed: false },
      { id: "hw_8", title: "Guardar o material de escola na mochila", completed: false }
    ]
  },
  {
    id: "task_drink_water",
    title: "Beber Água",
    description: "Hidratação saudável e revigorante ao longo do dia.",
    durationMinutes: 2,
    iconName: "Droplets",
    steps: [
      { id: "water_1", title: "Pegar o copo ou a garrafa de água", completed: false },
      { id: "water_2", title: "Beber água devagar para se hidratar", completed: false },
      { id: "water_3", title: "Colocar a garrafa no lugar certo ou copo na pia", completed: false }
    ]
  },
  {
    id: "task_bathroom",
    title: "Banheiro",
    description: "Sequência higiênica e respeitosa para uso do sanitário.",
    durationMinutes: 8,
    iconName: "Sparkles",
    steps: [
      { id: "bathr_1", title: "Abaixar as calças ou saia", completed: false },
      { id: "bathr_2", title: "Abaixar a cueca ou calcinha", completed: false },
      { id: "bathr_3", title: "Sentar no vaso sanitário", completed: false },
      { id: "bathr_4", title: "Fazer xixi ou cocô com calma", completed: false },
      { id: "bathr_5", title: "Pegar um pedaço de papel higiênico para se limpar", completed: false },
      { id: "bathr_6", title: "Limpar o bumbum", completed: false },
      { id: "bathr_7", title: "Limpar a parte da frente", completed: false },
      { id: "bathr_8", title: "Subir a calcinha ou cueca", completed: false },
      { id: "bathr_9", title: "Subir a calça ou saia", completed: false },
      { id: "bathr_10", title: "Dar a descarga no vaso", completed: false },
      { id: "bathr_11", title: "Lavar bem as mãos com sabonete", completed: false },
      { id: "bathr_12", title: "Secar as mãos com toalha ou papel", completed: false }
    ]
  },
  {
    id: "task_medicine",
    title: "Remédio (se tiver)",
    description: "Administração segura do medicamento com apoio dos pais.",
    durationMinutes: 3,
    iconName: "Activity",
    steps: [
      { id: "med_1", title: "Aguardar a mamãe ou papai preparar o remédio", completed: false },
      { id: "med_2", title: "Tomar o remédio com calma", completed: false },
      { id: "med_3", title: "Beber um gole de água ou suco para ajudar", completed: false }
    ]
  },
  {
    id: "task_playground",
    title: "Parquinho",
    description: "Brincadeiras ao ar livre, coordenação motora e socialização.",
    durationMinutes: 30,
    iconName: "Sun",
    steps: [
      { id: "park_1", title: "Colocar calçados adequados e protetor solar/boné", completed: false },
      { id: "park_2", title: "Ir ao parquinho com os responsáveis", completed: false },
      { id: "park_3", title: "Brincar nos brinquedos (balanço, escorregador) e revezar com os amigos", completed: false },
      { id: "park_4", title: "Beber água e avisar quando cansar", completed: false }
    ]
  },
  {
    id: "task_outing",
    title: "Passeio",
    description: "Preparação organizada para passeios externos e viagens em família.",
    durationMinutes: 25,
    iconName: "Car",
    steps: [
      { id: "out_1", title: "Tomar banho", completed: false },
      { id: "out_2", title: "Escovar os dentes", completed: false },
      { id: "out_3", title: "Vestir a roupa de passeio", completed: false },
      { id: "out_4", title: "Colocar sapatos ou meias e tênis", completed: false },
      { id: "out_5", title: "Pentear os cabelos", completed: false },
      { id: "out_6", title: "Entrar no carro ou ônibus para o passeio", completed: false }
    ]
  }
];

export const AUTISM_DEFAULT_PAIRS: ChoicePair[] = [
  {
    id: "pair_morning",
    label: "☀️ Rotina da Manhã",
    taskAId: "task_brush_teeth",
    taskBId: "task_breakfast",
    active: true
  },
  {
    id: "pair_afternoon",
    label: "🎒 Escola & Tarde",
    taskAId: "task_go_to_school",
    taskBId: "task_lunch",
    active: false
  },
  {
    id: "pair_play_study",
    label: "🧸 Tarde & Estudo",
    taskAId: "task_homework",
    taskBId: "task_free_play",
    active: false
  },
  {
    id: "pair_night",
    label: "🌙 Rotina da Noite",
    taskAId: "task_bath",
    taskBId: "task_sleep",
    active: false
  }
];

export const AUTISM_DEFAULT_ALARMS: Alarm[] = [
  {
    id: "alarm_breakfast",
    taskId: "task_breakfast",
    taskTitle: "Tomar Café da Manhã",
    time: "07:30",
    earlyWarningMinutes: 15,
    active: true,
    repeatDays: [1, 2, 3, 4, 5]
  },
  {
    id: "alarm_brush",
    taskId: "task_brush_teeth",
    taskTitle: "Escovar os Dentes",
    time: "08:00",
    earlyWarningMinutes: 10,
    active: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    id: "alarm_lunch",
    taskId: "task_lunch",
    taskTitle: "Almoço",
    time: "12:00",
    earlyWarningMinutes: 15,
    active: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    id: "alarm_homework",
    taskId: "task_homework",
    taskTitle: "Tarefa de Casa",
    time: "14:30",
    earlyWarningMinutes: 15,
    active: true,
    repeatDays: [1, 2, 3, 4, 5]
  },
  {
    id: "alarm_bath",
    taskId: "task_bath",
    taskTitle: "Banho",
    time: "19:00",
    earlyWarningMinutes: 15,
    active: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    id: "alarm_screens",
    taskId: "task_turn_off_screens",
    taskTitle: "Desligar Telas",
    time: "20:00",
    earlyWarningMinutes: 15,
    active: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    id: "alarm_sleep",
    taskId: "task_sleep",
    taskTitle: "Deitar para Dormir",
    time: "21:00",
    earlyWarningMinutes: 15,
    active: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6]
  }
];
