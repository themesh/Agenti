/**
 * Created by Babis Boikos on 02/04/2015.
 */
AGENTI.offerta = (function () {

    var offertaHeader = {totaleOfferta: 0},
        offertaDetail = [];

    // add an item to the offerta table and update total
    var addItem = function (itemId, itemDesc, qty, prezzo, nota) {
        var totaleRiga = parseFloat(qty.replace(',', '.')) * parseFloat(prezzo.replace(',', '.'));

        //Better add some validation in the view instead of this shit
        if (isNaN(totaleRiga)) {
            totaleRiga = 0;
        }

        offertaDetail.push({
            itemId: itemId,
            itemDesc: itemDesc,
            qty: qty,
            prezzo: prezzo,
            totaleRiga: totaleRiga,
            nota: nota
        });

        offertaHeader.totaleOfferta = offertaHeader.totaleOfferta + totaleRiga; //summing the grand total of the offerta

    };

    //delete item from the dom table and from the model (offertaDetail), and update the offerta rotal in header.
    var deleteItem = function (item, totalDiv) {

        var tableRow = item.parents("tr"); //cache the current row on the dom
        var itemForDeletion = item.parents("tr").prevAll("tr").length; //get the number of rows before the row to be deleted, use this for splicing model array
        var totaleRiga = offertaDetail[itemForDeletion].totaleRiga;

        navigator.notification.confirm(
            "Cancellare articolo?",
            // callback
            function (buttonIndex) {
                if (buttonIndex === 1) {

                    tableRow.remove(); //remove table row from DOM
                    offertaDetail.splice(itemForDeletion, 1); //remove listino from model

                    //update totale in model
                    offertaHeader.totaleOfferta = offertaHeader.totaleOfferta - totaleRiga;

                    //DOM update total on the page
                    totalDiv.text(offertaHeader.totaleOfferta.toFixed(2).replace(/\./g, ","));

                }
            },            // callback to invoke with index of button pressed
            'Attenzione',           // title
            ['Cancella articolo', 'Annulla']         // buttonLabels
        );

        event.preventDefault();
    };

    var renderOffertaDetail = function () {

        $('#offertaDetail').find('h5').text('Offerta a ' + AGENTI.client.ragSociale());

        $.each(offertaDetail, function () {
            $('#offertaTable tbody').append('<tr><td>' + this.itemId + '</td><td style=" font-weight: bold">' + this.itemDesc + '</td><td>' +
            this.qty.replace(/\./g, ",") + '</td><td>' + '&#8364;' + this.prezzo.replace(/\./g, ",") + '</td>><td>' + '&#8364;' + this.totaleRiga.toFixed(2).replace(/\./g, ",") + '</td><td>' +
            this.nota + '</td><td>' + '<button class="ui-btn ui-icon-delete ui-btn-icon-notext ui-corner-all ui-mini deleteOffertaDetailRow">Cancella</button></td></tr>');
        });

        $('#totaleOfferta').text(offertaHeader.totaleOfferta.toFixed(2).replace(/\./g, ","));
        $('noteOffertaHeader').text(offertaHeader.note);
        $('#offertaTable').table("refresh");
    };

    var checkIsInserted = function (e) {
        if (offertaDetail.length !== 0) {
            AGENTI.utils.vibrate(AGENTI.deviceType);
            navigator.notification.confirm(
                "Cancellare l'offerta inserita?", // message
                deleteCurrentOfferta,            // callback to invoke with index of button pressed
                'Attenzione',           // title
                ['Elimina offerta', 'Annulla']         // buttonLabels
            );

        } else {
            $.mobile.changePage("#clienti", {transition: "flip"});
        }
        if (e) {
            e.preventDefault();
        }

    };

    var deleteCurrentOfferta = function (buttonIndex) {
        if (buttonIndex === 1) {
            offertaDetail.length = 0; //empty offerta detail array
            offertaHeader = {totaleOfferta: 0, note : ""}; //reset offerta total
            $('#totaleOfferta').text(offertaHeader.totaleOfferta.toFixed(2).replace(/\./g, ",")); //reset offerta total on DOM
            $('#offertaTable tbody').empty(); // empty table in offerta detail page
            $('#offertaConfermedCheck').attr("checked", false).checkboxradio("refresh");
            $('#noteOffertaHeader').val("");

            navigator.notification.alert('Offerta cancellata');
        }

    };

    var sendOfferta = function () {
        var emailProperties = {
                to: AGENTI.client.email(),
                cc: [AGENTI.db.getItem('email')],
                subject: 'Offerta Sidercampania Professional srl',
                isHtml: true
            },
            tableData = [],
            columns = [],
            options = {},
            height = 180,
            splitText = "",
            noteHeight = 0,
            pdfFileName,
            pdfFilePath;

        if (offertaDetail.length !== 0) {


            //FIRST GENERATE THE PDF DOCUMENT
            pdfFileName = 'offerta.pdf';
            offertaHeader.note = $('#noteOffertaHeader').val();

            console.log("generating pdf...");
            var doc = new jsPDF('p', 'pt', 'a4');

            doc.setFontSize(20);
            doc.setFontType("bold");
            doc.text(20, 50, 'Sidercampania Professional srl');

            doc.setFontSize(12);
            doc.setFontType("normal");
            doc.text(20, 65, 'Offerta commerciale');

            doc.setFontSize(10);
            doc.text(20, 80, 'Spett.le: ' + AGENTI.client.ragSociale());
            doc.text(20, 95, AGENTI.client.indirizzo());
            doc.text(20, 110, AGENTI.client.indirizzo2());

            options = {
                padding: 3, // Vertical cell padding
                fontSize: 10,
                lineHeight: 15,
                renderCell: function (x, y, w, h, txt, fillColor, options) {
                    doc.setFillColor.apply(this, fillColor);
                    doc.rect(x, y, w, h, 'F');
                    doc.text(txt, x + options.padding, y + doc.internal.getLineHeight());
                },
                margins: {horizontal: 20, top: 130, bottom: 40}, // How much space around the table
                extendWidth: true // If true, the table will span 100% of page width minus horizontal margins.
            };

            columns = [
                {title: "Codice", key: "codice"},
                {title: "Descrizione", key: "descrizione"},
                {title: "Note", key: "nota"},
                {title: "Qta", key: "qta"},
                {title: "Prezzo", key: "prezzo"},
                {title: "Totale", key: "totale"}
            ];


            $.each(offertaDetail, function () {

                tableData.push({
                    "codice": this.itemId,
                    "descrizione": this.itemDesc,
                    "nota": this.nota,
                    "qta": this.qty.replace(/\./g, ","),
                    "prezzo": this.prezzo.replace(/\./g, ","),
                    "totale": this.totaleRiga.toFixed(2).replace(/\./g, ",") //change into string again and replace dots with comas
                });
                height = height + 20;
            });

            doc.autoTable(columns, tableData, options);
            //height = doc.drawTable(tableData, {xstart:15,ystart:20,tablestart:50,marginleft:50, xOffset:5, yOffset:5});

            doc.setFontType("bolditalic");
            doc.setFontSize(12);
            doc.text(400, height, 'Totale offerta: ' + offertaHeader.totaleOfferta.toFixed(2).replace(/\./g, ",") + ' +IVA');

            doc.setFontType("normal");
            doc.setFontSize(10);
            doc.text(20, height + 20, 'Note aggiuntive: ');
            splitText = doc.splitTextToSize(offertaHeader.note, 550); //this text could be long so we have to split it in chunks
            doc.text(20, height + 35, splitText);

            noteHeight = splitText.length * 15; //push everything bellow the notes field down according to how many lines its is (lines*15pt)

            doc.setFontType("bolditalic");
            doc.setFontSize(10);
            doc.text(20, height + noteHeight + 70, 'La Sidercampania Professional srl non e\' responsabile per eventuali ritardi di consegna del materiale, dovuta ');
            doc.text(20, height + noteHeight + 85, 'ai nostri fornitori ed il loro ciclo di produzione e trasporto.');
            doc.text(20, height + noteHeight + 110, 'Validita\' offerta 15gg');

            doc.setFontType("normal");
            doc.text(20, height + noteHeight + 125, 'Nominativo addetto: ' + AGENTI.db.getItem('full_name'));

            var pdfOutput = doc.output();
            console.log(pdfOutput);

            function pdfSave(name, data, success, fail) {

                var gotFileSystem = function (fileSystem) {

                    pdfFilePath = fileSystem.root.nativeURL;

                    fileSystem.root.getFile(name, {create: true, exclusive: false}, gotFileEntry, fail);
                };

                var gotFileEntry = function (fileEntry) {
                    fileEntry.createWriter(gotFileWriter, fail);
                };

                var gotFileWriter = function (writer) {
                    writer.onwrite = success;
                    writer.onerror = fail;
                    writer.write(data);
                };

                window.requestFileSystem(window.LocalFileSystem.PERSISTENT, data.length || 0, gotFileSystem, fail);
            }

            pdfSave(pdfFileName, pdfOutput, function () {

                // success! - generate email body
                emailProperties.body = Date.today().toString("dd-MM-yyyy") + '<h3>Spettabile cliente ' + AGENTI.client.ragSociale() + '</h3>' +
                '<p>A seguito Vs. richiesta inviamo in allegato la ns. migliore offerta relativa agli articoli specificati.<br>' +
                'Attendiamo Vs. conferma per procedere con l&apos;evasione dell&apos;ordine.</p>' +
                '<p>Distini saluti,<br>' + AGENTI.db.getItem('full_name') + '<br>Sidercampania Professional srl<br>' +
                'tel. 0817580177<br>Fax 0815405590</p>';


                emailProperties.attachments = pdfFilePath + pdfFileName;

                //if offerta is definitiva add the 'vendite' email to the cc array of emaiProperties
                if ($('#offertaConfermedCheck').is(':checked')) {
                    emailProperties.cc.push('vendite@siderprofessional.com');
                }

                cordova.plugins.email.open(emailProperties, function () {
                    //navigator.notification.alert('invio annullato'); //fix this, it always executes his part
                }, this);


            }, function (error) {
                // handle error
                console.log(error);
                navigator.notification.alert(error);
            });

        }
    };


    var saveOfferta = function () {

        if (offertaDetail.length !== 0) {
            AGENTI.utils.vibrate(AGENTI.deviceType);
            navigator.notification.confirm(
                "Salvare l'offerta inserita?", // message

                //callback
                function (buttonIndex) {
                    if (buttonIndex === 1) {

                        //initialise sqLite database
                        var sqliteDb = AGENTI.sqliteDB

                        //execute sql
                        sqliteDb.transaction(function (tx) {

                            tx.executeSql('CREATE TABLE IF NOT EXISTS offertaTes (id INTEGER PRIMARY KEY, data TEXT, data_num INTEGER)');
                            tx.executeSql('CREATE TABLE IF NOT EXISTS offertaRig (id INTEGER PRIMARY KEY, data TEXT, data_num INTEGER)');

                            //sql save header
                            tx.executeSql("INSERT INTO offertaTes (data, data_num) VALUES (?,?)", ["test", 100], function (tx, res) {
                                console.log("insertId: " + res.insertId + " -- probably 1");
                                console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
                            }, function (e) {
                                console.log("ERROR: " + e.message);
                            });

                            //sql save offerta detail
                            $.each(offertaDetail, function () {
                                tx.executeSql("INSERT INTO offertaRig (data, data_num) VALUES (?,?)", ["test", 100], function (tx, res) {
                                    console.log("insertId: " + res.insertId + " -- probably 1");
                                    console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
                                }, function (e) {
                                    console.log("ERROR: " + e.message);
                                });
                            });

                        });

                    };
                },
                'Attenzione',           // title
                ['Salva offerta', 'Annulla']         // buttonLabels
            );
        }
        ;
    };


    //getter functions for exporting private variables
    var getOffertaDetail = function () {
        return offertaDetail;
    };

    return {
        addItem: addItem,
        deleteItem: deleteItem,
        renderOffertaDetail: renderOffertaDetail,
        checkIsInserted: checkIsInserted,
        deleteCurrentOfferta: deleteCurrentOfferta,
        sendOfferta: sendOfferta,
        saveOfferta: saveOfferta,
        detail: getOffertaDetail
    };

})();