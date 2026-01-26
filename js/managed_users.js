export const TYM_AUX_LIST = [
    { username: '1002730727', name: 'JHON WILSON GIRALDO CARVAJAL' },
    { username: '9976558', name: 'EDWIN FELIPE RINCON RAMIREZ' },
    { username: '1087990176', name: 'ESTIVEN GUTIERREZ SALAZAR' },
    { username: '10138323', name: 'ROVINSON TORRES RIVERA' },
    { username: '9910933', name: 'ARBEY DE JESUS LARGO LARGO' },
    { username: '1060652216', name: 'CRISTIAN CAMILO OSPINA PARRA' },
    { username: '1058821245', name: 'VICTOR ALFONSO PULGARIN MEJIA' },
    { username: '1112227774', name: 'CHRISTIAN DAVID CAICEDO MONTAÑO' },
    { username: '1112226698', name: 'JOSE ALEXANDER CONSTAIN PERLAZA' },
    { username: '18524020', name: 'EDWIN MAURICIO GOMEZ GALINDO' },
    { username: '1053866136', name: 'ADRIAN FELIPE MARTINEZ ORTEGON' },
    { username: '1088253407', name: 'CARLOS ANDRES PINEDA CANO' },
    { username: '1004520985', name: 'FEDERICO MOLANO ZAPATA' },
    { username: '1112778308', name: 'LUIS CARLOS CADAVID RESTREPO' },
    { username: '1089933391', name: 'BRAHIAN STIVEN VALENCIA IGLESIAS' },
    { username: '1088249115', name: 'JOHN EDWAR ZAPATA ACEVEDO' },
    { username: '1004671619', name: 'BRANDON STEVEN GIL BAEZ' },
    { username: '1004778577', name: 'JUAN MANUEL DELGADO NARVAEZ' },
    { username: '1116818471', name: 'GABRIEL ALEJANDRO GAMEZ VALERO' },
    { username: '1007783801', name: 'YEISON DAVID RENDON SOTO' },
    { username: '1088334475', name: 'SEBASTIAN VILLADA VELASQUEZ' },
    { username: '1127384755', name: 'CAMILO ANDRES CONTRERAS RIVAS' },
    { username: '1114151107', name: 'ANDRES FELIPE VILLA OSORIO' },
    { username: '1087995995', name: 'JHONATAN RENDON RINCON' },
    { username: '1089602261', name: 'JUAN JOSE NOREÑA OSORIO' },
    { username: '18494949', name: 'NELSON ZULUAGA ACEVEDO' },
    { username: '18519474', name: 'OSCAR MAURICIO RESTREPO MORENO' },
    { username: '18517128', name: 'JHON FREDY MORENO' },
    { username: '1088331177', name: 'MICHAEL STEVEN HENAO RODRIGUEZ' },
    { username: '1002718622', name: 'JUAN CAMILO COCOMA OROZCO' },
    { username: '10033035', name: 'CESAR AUGUSTO CASTILLO LONDOÑO' },
    { username: '1112776419', name: 'JAMMES ALBERTO RAMIREZ NIETO' },
    { username: '1098724347', name: 'SEBASTIAN SALAZAR HENAO' },
    { username: '1088037094', name: 'DANIEL FELIPE MURILLO GRANDA' },
    { username: '1128904709', name: 'BRAHIAN ECHEVERRY ALVAREZ' },
    { username: '1088348091', name: 'JEISON STIVEN LAVADO MARIN' },
    { username: '1089601941', name: 'FELIPE MONTES RIVERA' },
    { username: '1010159801', name: 'BRANDON ESTIVEN TORO GALVIS' },
    { username: '1004700767', name: 'DAVID ALEJANDRO RIVERA' },
    { username: '1022364037', name: 'RONALD ADOLFO ANGULO MACUASE' },
    { username: '1112763651', name: 'JULIAN DAVID CORTES' },
    { username: '1093220521', name: 'JUAN DIEGO FRANCO' }
];

export const TAT_AUX_LIST = [
    { username: '1193105349', name: 'MICHAEL CONTRERAS HURTADO' },
    { username: '75071571', name: 'LUIS ALFONSO RIOS GONZALEZ' },
    { username: '1088017580', name: 'JOHN ANDRES CASTILLO GIRALDO' },
    { username: '1089097145', name: 'MANUEL ALEJANDRO RAMIREZ OVALLE' },
    { username: '1088305468', name: 'JULIAN DAVID RODRIGUEZ MONTOYA' },
    { username: '1058842716', name: 'MAIKOL ESTIVEN CARDONA TORO' },
    { username: '1094956074', name: 'YERFREY FLORES ARROYAVE' },
    { username: '18519387', name: 'FIDEL HERNANDO GARCIA CORREA' },
    { username: '10030398', name: 'JOHN RAUL GRAJALES CANO' },
    { username: '1004667097', name: 'JUAN GUILLERMO FERNANDEZ GIRALDO' },
    { username: '18516953', name: 'JOSE ARLEY MARIN HERRERA' },
    { username: '1055831421', name: 'SAMUEL ANDRES ARIAS ARCILA' },
    { username: '1005048479', name: 'NATALY MOLINA BECERRA' },
    { username: '80433929', name: 'LINO LOPEZ SIMONS' },
    { username: '1060506540', name: 'YENIFER ANDREA SOTO GARZON' },
    { username: '1060586518', name: 'NELLY YURANNY SALDARRIAGA CAÑAS' },
    { username: '1078456086', name: 'NELWIS DEYVER CORDOBA MOSQUERA' },
    { username: '1085717552', name: 'DANIEL ANDRES OLAYA PEREZ' },
    { username: '1053849016', name: 'YHONY ALEXANDER LOPEZ LOPEZ' },
    { username: '1076350176', name: 'DANIELA CASTIBLANCO RAMIREZ' }
];

export const TYM_USERNAMES = new Set([
    'admin_tym',
    ...TYM_AUX_LIST.map(u => String(u.username).trim())
]);

export const TAT_USERNAMES = new Set([
    'admin',
    ...TAT_AUX_LIST.map(u => String(u.username).trim())
]);
