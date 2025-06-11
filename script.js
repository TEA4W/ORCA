        // console.log("Script da Calculadora Iniciado"); 
        let idx = 0;
        const IVA_RATE = 0.23; 
        const CORRECT_PASSWORD = "Mddkdsds1"; 

        const sellerSignatures = {
            "Armando Alves": "Armando Alves\n913313174\narmando.alves@mydynamic.pt",
            "Ângelo Lobo": "Ângelo Lobo\n918789192\nangelo.lobo@mydynamic.pt",
            "Carla Loução": "Carla Loução\n915832584\ngeral@mydynamic.pt",
            "Valeriya Ishchenko": "Valeriya Ishchenko\n918379037\nwww.mydynamic.pt",
            "Gonçalo Alves": "Gonçalo A.V. Alves\n912030078\ninfo.mydynamic@gmail.com"
        }; // Define sellerSignatures as an empty object

        let equipmentData = {}; // Initialize as empty object, will be populated from JSON
        const MONITOR_BASE_CHARGE_IVA_INCLUSIVE = 89;
        const MONITOR_HOURLY_EXTRA_IVA_INCLUSIVE = 20; // Added this constant

        let transportationFees = {}; // Initialize as empty, will be populated from JSON
        let paymentConditionsData = []; // To be populated from JSON
        let paymentMethodsData = []; // To be populated from JSON

        async function fetchEquipmentData() {
            try {
                const response = await fetch('api.php?endpoint=equipment_data&v=' + new Date().getTime());
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                equipmentData = await response.json();
                processEquipmentData(); // Process the data after fetching
                console.log("Equipment data loaded and processed successfully.");
                return true;
            } catch (error) {
                console.error("Could not load equipment data:", error);
                return false;
            }
        }

        async function fetchTransportationFees() {
            try {
                const response = await fetch('api.php?endpoint=transportation_fees&v=' + new Date().getTime());
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                transportationFees = await response.json();
                console.log("Transportation fees loaded successfully.");
                return true;
            } catch (error) {
                console.error("Could not load transportation fees:", error);
                return false;
            }
        }

        async function fetchPaymentConditions() {
            try {
                const response = await fetch('api.php?endpoint=payment_conditions&v=' + new Date().getTime());
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                paymentConditionsData = await response.json();
                console.log("Payment conditions loaded successfully.");
                return true;
            } catch (error) {
                console.error("Could not load payment conditions:", error);
                return false;
            }
        }

        async function fetchPaymentMethods() {
            try {
                const response = await fetch('api.php?endpoint=payment_methods&v=' + new Date().getTime());
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                paymentMethodsData = await response.json();
                console.log("Payment methods loaded successfully.");
                return true;
            } catch (error) {
                console.error("Could not load payment methods:", error);
                return false;
            }
        }

        function processEquipmentData() {
            for (const key in equipmentData) {
                if (equipmentData.hasOwnProperty(key)) {
                    const equipment = equipmentData[key];
                    if (equipment.image_url) {
                        // Normalize the URL: remove prefix if it exists, and decode URL components
                        let normalizedUrl = equipment.image_url.startsWith('imagens/') ? equipment.image_url.substring(8) : equipment.image_url;
                        equipment.image_url = decodeURIComponent(normalizedUrl);
                    }
                }
            }
        }

        function populateTransportLocations() {
            // console.log("[populateTransportLocations] Iniciando população de localidades.");
            const selectElement = document.getElementById('transportLocation');
            if (!selectElement) {
                console.error("[populateTransportLocations] ERRO: Elemento select 'transportLocation' não encontrado.");
                return;
            }
            selectElement.innerHTML = ''; 
            const defaultOption = document.createElement('option');
            defaultOption.value = "Nenhuma";
            defaultOption.textContent = "Selecionar localidade...";
            selectElement.appendChild(defaultOption);
            
            const sortedLocations = Object.keys(transportationFees).filter(loc => loc !== "Nenhuma").sort();
            // console.log(`[populateTransportLocations] Número de localidades para adicionar: ${sortedLocations.length}`);

            sortedLocations.forEach(locationName => {
                const option = document.createElement('option');
                option.value = locationName;
                option.textContent = locationName;
                selectElement.appendChild(option);
            });
            // console.log("[populateTransportLocations] População de localidades concluída.");
        }

        function populatePaymentConditions() {
            const container = document.getElementById('condicoesPagamentoOptions');
            if (!container) {
                console.error("Container for payment conditions not found.");
                return;
            }
            container.innerHTML = ''; // Clear existing
            paymentConditionsData.forEach(condition => {
                const label = document.createElement('label');
                label.className = 'radio-label';
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'condPagamento';
                input.value = condition.value;
                input.id = condition.htmlId;
                if (condition.defaultChecked) {
                    input.checked = true;
                }
                input.onchange = update; // Assuming update() handles general recalculations
                label.appendChild(input);
                label.appendChild(document.createTextNode(` ${condition.label}`));
                container.appendChild(label);
            });
        }

        function populatePaymentMethods() {
            const container = document.getElementById('metodosPagamentoOptions');
            if (!container) {
                console.error("Container for payment methods not found.");
                return;
            }
            container.innerHTML = ''; // Clear existing
            paymentMethodsData.forEach(method => {
                const label = document.createElement('label');
                label.className = 'checkbox-label sub-checkbox-label';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = method.id;
                if (method.defaultChecked) {
                    input.checked = true;
                }
                input.onchange = update; // Assuming update() handles general recalculations
                label.appendChild(input);
                label.appendChild(document.createTextNode(` ${method.label}`));
                container.appendChild(label);
            });
        }

        function today() {
            return new Date().toISOString().substr(0, 10);
        }
        
        function handleGlobalPriceControlsChange() { 
            update();
        }
        
        function toggleItemSpecificOptions(itemIndex, showDates, showTimes) {
            const itemDatesDiv = document.getElementById(`itemDates${itemIndex}`);
            const itemTimesDiv = document.getElementById(`itemTimes${itemIndex}`);

            if (itemDatesDiv) {
                itemDatesDiv.style.display = showDates ? 'flex' : 'none';
                if (showDates) {
                    const itemFromDateInput = document.getElementById(`itemFromDate${itemIndex}`);
                    const itemToDateInput = document.getElementById(`itemToDate${itemIndex}`);
                    if (itemFromDateInput && !itemFromDateInput.value) {
                        itemFromDateInput.value = document.getElementById('fromDate').value || today();
                    }
                    if (itemToDateInput && !itemToDateInput.value) {
                        itemToDateInput.value = document.getElementById('toDate').value || today();
                    }
                }
            }
            if (itemTimesDiv) {
                itemTimesDiv.style.display = showTimes ? 'flex' : 'none';
                 if (showTimes) {
                    const itemFromTimeInput = document.getElementById(`itemFromTime${itemIndex}`);
                    const itemToTimeInput = document.getElementById(`itemToTime${itemIndex}`);
                    if (itemFromTimeInput && !itemFromTimeInput.value) {
                        itemFromTimeInput.value = document.getElementById('fromTime').value || '';
                    }
                    if (itemToTimeInput && !itemToTimeInput.value) {
                        itemToTimeInput.value = document.getElementById('toTime').value || '';
                    }
                }
            }
        }

        function updateItemDateTimeSectionVisibility(itemIndex) {
            const dateTimeTitle = document.getElementById(`dateTimeTitle${itemIndex}`);
            const itemOptionsContainer = document.getElementById(`itemOptionsContainer${itemIndex}`);

            if (!dateTimeTitle || !itemOptionsContainer) {
                return;
            }

            const globalDatesChecked = document.getElementById('globalDatesApply').checked;
            const globalTimesChecked = document.getElementById('globalTimesApply').checked;

            if (globalDatesChecked && globalTimesChecked) {
                dateTimeTitle.style.display = 'none';
                itemOptionsContainer.style.display = 'none';
            } else {
                dateTimeTitle.style.display = 'block';
                itemOptionsContainer.style.display = 'flex';
            }
        }

        function handleGlobalDatesApplyChange() {
            const showItemDates = !document.getElementById('globalDatesApply').checked;
            const showItemTimes = !document.getElementById('globalTimesApply').checked; 
            for (let i = 0; i < idx; i++) {
                toggleItemSpecificOptions(i, showItemDates, showItemTimes);
                updateItemDateTimeSectionVisibility(i);
            }
            update();
        }

        function handleGlobalTimesApplyChange() {
            const showItemDates = !document.getElementById('globalDatesApply').checked; 
            const showItemTimes = !document.getElementById('globalTimesApply').checked;
            for (let i = 0; i < idx; i++) {
                 toggleItemSpecificOptions(i, showItemDates, showItemTimes);
                 updateItemDateTimeSectionVisibility(i);
            }
            update();
        }


        function checkPredefinedPrice(itemIndex) {
            const nameInput = document.getElementById(`name${itemIndex}`);
            const priceInput = document.getElementById(`price${itemIndex}`);
            
            // console.log(`[checkPredefinedPrice] Item ${itemIndex}, Nome Inserido: '${nameInput ? nameInput.value : 'N/A'}'`);

            if (nameInput && priceInput) {
                const itemName = nameInput.value.trim();
                const enteredItemNameLower = itemName.toLowerCase();
                let foundMatch = false;

                // console.log(`   Nome Processado (lowercase, trimmed): '${enteredItemNameLower}'`);

                for (const predefinedName in equipmentData) { // Changed from predefinedPrices
                    if (equipmentData.hasOwnProperty(predefinedName)) { // Changed from predefinedPrices
                        if (predefinedName.toLowerCase() === enteredItemNameLower) {
                            const ivaInclusivePrice = equipmentData[predefinedName].price; // Changed from predefinedPrices[predefinedName]
                            priceInput.value = ivaInclusivePrice; // Directly set the IVA-inclusive price
                            priceInput.dataset.originalIvaInclusivePrice = ivaInclusivePrice; 
                            priceInput.dataset.manualOverride = 'false';
                            delete priceInput.dataset.enteredWithIvaExclusive; // Remove flag
                            // console.log(`   CORRESPONDÊNCIA ENCONTRADA: '${predefinedName}', Preço IVA Incl.: ${ivaInclusivePrice}`);
                            foundMatch = true;
                            break; 
                        }
                    }
                }
                if (!foundMatch) {
                    // priceInput.dataset.originalIvaInclusivePrice = ''; // Keep this if name is cleared and no match
                    // If no match, and it wasn't manual override before, it might become manual implicitly
                    // However, if user just clears name, price shouldn't become manual. 
                    // This part is tricky. If name is cleared, price shouldn't become manual.
                    // For now, if no match, we don't alter manualOverride or enteredWithIvaExclusive directly here.
                    // If priceInput.value is empty and dataset is empty, it will be treated as 0 price.
                    // If name is cleared, and then user types a price, oninput for price will set manual flags.
                    if (!priceInput.dataset.manualOverride || priceInput.dataset.manualOverride === 'false') {
                        priceInput.dataset.originalIvaInclusivePrice = ''; 
                        // if name is empty and we had a predefined price, clear the value
                        if (itemName === '' && priceInput.dataset.originalIvaInclusivePrice === '') priceInput.value = '';
                    }
                }
                // updateOneDisplayedItemPrice(itemIndex); // This will be removed
            } else {
                // console.error(`   ERRO: nameInput ou priceInput não encontrado para o item ${itemIndex}`);
            }
            update(); 
        }

        function updateOneDisplayedItemPrice(itemIndex) {
            const priceInput = document.getElementById(`price${itemIndex}`);
            if (!priceInput) {
                // console.error(`[updateOneDisplayedItemPrice] ERRO: PriceInput não encontrado para o item ${itemIndex}`);
                return;
            }
            
            let basePriceForCalculations;
            const originalIvaInclusivePriceFromDataset = parseFloat(priceInput.dataset.originalIvaInclusivePrice);
            const currentItemPriceFieldValue = parseFloat(priceInput.value);

            if (priceInput.dataset.manualOverride === 'true' && !isNaN(currentItemPriceFieldValue)) {
                if (document.getElementById('iva').checked) { 
                    basePriceForCalculations = currentItemPriceFieldValue * (1 + IVA_RATE); 
                } else { 
                    basePriceForCalculations = currentItemPriceFieldValue; 
                }
                // console.log(`[updateOneDisplayedItemPrice] Usando preço manual (convertido para COM IVA se necessário): ${basePriceForCalculations}`);
            } else if (!isNaN(originalIvaInclusivePriceFromDataset) && originalIvaInclusivePriceFromDataset > 0) {
                basePriceForCalculations = originalIvaInclusivePriceFromDataset;
                //  console.log(`[updateOneDisplayedItemPrice] Usando preço do dataset: ${basePriceForCalculations}`);
            } else {
                priceInput.value = '';
                // console.log(`[updateOneDisplayedItemPrice] Nenhum preço válido, campo de preço limpo.`);
                return; 
            }

            let displayPrice = basePriceForCalculations; 

            if (document.getElementById('iva').checked) { 
                displayPrice /= (1 + IVA_RATE);
            }
            if (document.getElementById('partner').checked) {
                displayPrice *= 0.85;
            }
            priceInput.value = displayPrice.toFixed(2);
            // console.log(`   Preço do campo atualizado para o item ${itemIndex}: ${priceInput.value}`);
        }


        function addItem() {
            const itemsContainer = document.getElementById('items');
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            const currentItemIdx = idx; 
            itemDiv.id = 'item' + currentItemIdx;

            const removeButton = document.createElement('button');
            removeButton.className = 'remove';
            removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            removeButton.onclick = function() { removeItem(currentItemIdx); };
            itemDiv.appendChild(removeButton);

            const topRowContainer = document.createElement('div');
            topRowContainer.className = 'item-top-row';

            // Name Field
            const nameFieldContainer = document.createElement('div');
            nameFieldContainer.className = 'name-field-container';
            const nameLabel = document.createElement('label');
            nameLabel.innerHTML = 'Nome do Equipamento:';
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.id = `name${currentItemIdx}`;
            nameInput.placeholder = 'Ex: Castelo Azul';
            const suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'autocomplete-suggestions';
            suggestionsContainer.style.display = 'none';
            
            nameInput.oninput = (event) => {
                const inputText = event.target.value.toLowerCase();
                suggestionsContainer.innerHTML = '';
                if (inputText.length < 1) {
                    suggestionsContainer.style.display = 'none';
                    const priceField = document.getElementById(`price${currentItemIdx}`);
                    if(priceField) {
                        priceField.dataset.manualOverride = 'false'; 
                        priceField.dataset.enteredWithIvaExclusive = 'false';
                    } 
                    checkPredefinedPrice(currentItemIdx);
                    return;
                }

                const filteredNames = Object.keys(equipmentData).filter(name => 
                    name.toLowerCase().startsWith(inputText)
                ).sort();

                if (filteredNames.length > 0) {
                    filteredNames.forEach(name => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.className = 'suggestion-item';
                        const index = name.toLowerCase().indexOf(inputText);
                        const part1 = name.substring(0, index);
                        const match = name.substring(index, index + inputText.length);
                        const part2 = name.substring(index + inputText.length);
                        suggestionItem.innerHTML = `${part1}<strong>${match}</strong>${part2}`;

                        suggestionItem.onclick = () => {
                            nameInput.value = name;
                            suggestionsContainer.style.display = 'none';
                            const priceField = document.getElementById(`price${currentItemIdx}`);
                            if(priceField) {
                                priceField.dataset.manualOverride = 'false'; 
                                priceField.dataset.enteredWithIvaExclusive = 'false'; 
                            } 
                            checkPredefinedPrice(currentItemIdx);
                        };
                        suggestionsContainer.appendChild(suggestionItem);
                    });
                    suggestionsContainer.style.display = 'block';
                } else {
                    suggestionsContainer.style.display = 'none';
                    const priceField = document.getElementById(`price${currentItemIdx}`);
                     if(priceField) {
                        priceField.dataset.originalIvaInclusivePrice = '';
                        if (priceField.dataset.manualOverride !== 'true') {
                            priceField.value = '';
                        }
                    }
                    checkPredefinedPrice(currentItemIdx);
                }
            };

            nameInput.onblur = () => {
                setTimeout(() => {
                    suggestionsContainer.style.display = 'none';
                }, 150); 
            };
            
            nameLabel.appendChild(nameInput);
            nameFieldContainer.appendChild(nameLabel);
            nameFieldContainer.appendChild(suggestionsContainer);
            topRowContainer.appendChild(nameFieldContainer);

            itemDiv.appendChild(topRowContainer);

            // Price Field
            const priceLabel = document.createElement('label');
            priceLabel.innerHTML = 'Preço (€):';
            const priceInput = document.createElement('input');
            priceInput.type = 'number';
            priceInput.id = `price${currentItemIdx}`;
            priceInput.placeholder = 'Ex: 100';
            priceInput.dataset.originalIvaInclusivePrice = ''; 
            priceInput.dataset.manualOverride = 'false'; 
            priceInput.oninput = () => {
                const priceInputElement = document.getElementById(`price${currentItemIdx}`);
                if(priceInputElement) {
                    priceInputElement.dataset.originalIvaInclusivePrice = ''; 
                    priceInputElement.dataset.manualOverride = 'true'; 
                    priceInputElement.dataset.enteredWithIvaExclusive = document.getElementById('iva').checked;
                }
                update(); 
            };
            priceLabel.appendChild(priceInput);
            itemDiv.appendChild(priceLabel);
            
            // Quantity and Discount Row
            const quantityDiscountRow = document.createElement('div');
            quantityDiscountRow.className = 'quantity-discount-row';
            
            // Quantity Field
            const quantityContainer = document.createElement('div');
            quantityContainer.className = 'quantity-container left-aligned';
            const quantityLabel = document.createElement('label');
            quantityLabel.innerHTML = 'Quantidade:';
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.id = `quantity${currentItemIdx}`;
            quantityInput.value = '1';
            quantityInput.min = '1';
            quantityInput.oninput = update;
            quantityLabel.appendChild(quantityInput);
            quantityContainer.appendChild(quantityLabel);
            quantityDiscountRow.appendChild(quantityContainer);

            // Discount Field
            const basePriceDiscountContainer = document.createElement('div');
            basePriceDiscountContainer.className = 'item-discount-container';
            const discountLabel = document.createElement('label');
            discountLabel.innerHTML = 'Desconto (%):'
            const discountInput = document.createElement('input');
            discountInput.type = 'number';
            discountInput.id = `discount${currentItemIdx}`; // Voltar ao ID original
            discountInput.className = 'base-price-discount';
            discountInput.setAttribute('data-item-idx', currentItemIdx);
            discountInput.value = '0';
            discountInput.min = '0';
            discountInput.max = '100';
            discountInput.oninput = update;
            discountLabel.appendChild(discountInput);
            basePriceDiscountContainer.appendChild(discountLabel);
            quantityDiscountRow.appendChild(basePriceDiscountContainer);
            
            itemDiv.appendChild(quantityDiscountRow);
            
            // Monitor row
            const monitorRow = document.createElement('div');
            monitorRow.className = 'monitor-row';
            
            // Monitor Field
            const monitorContainer = document.createElement('div');
            monitorContainer.className = 'monitor-container';
            const monLabel = document.createElement('label');
            monLabel.innerHTML = 'Monitores:';
            const monInput = document.createElement('input');
            monInput.type = 'number';
            monInput.id = `mon${currentItemIdx}`;
            monInput.value = '0';
            monInput.min = '0';
            monInput.oninput = update;
            monLabel.appendChild(monInput);
            monitorContainer.appendChild(monLabel);
            monitorRow.appendChild(monitorContainer);
            
            // Monitor Include Checkbox
            const monitorIncluidoLabel = document.createElement('label');
            monitorIncluidoLabel.className = 'checkbox-label';
            const monitorIncluidoCheckbox = document.createElement('input');
            monitorIncluidoCheckbox.type = 'checkbox';
            monitorIncluidoCheckbox.id = `monitorIncluido${currentItemIdx}`;
            monitorIncluidoCheckbox.onchange = update;
            monitorIncluidoLabel.appendChild(monitorIncluidoCheckbox);
            monitorIncluidoLabel.appendChild(document.createTextNode(' Incluído'));
            monitorRow.appendChild(monitorIncluidoLabel);
            
            itemDiv.appendChild(monitorRow);
            
            const equipTimingToggleLabel = document.createElement('label');
            equipTimingToggleLabel.className = 'checkbox-label';
            equipTimingToggleLabel.style.marginTop = '10px'; 
            const equipTimingToggleCheckbox = document.createElement('input');
            equipTimingToggleCheckbox.type = 'checkbox';
            equipTimingToggleCheckbox.id = `equipTimingToggle${currentItemIdx}`;
            equipTimingToggleCheckbox.onchange = function() {
                const equipTimingDiv = document.getElementById(`itemEquipTiming${currentItemIdx}`);
                if (equipTimingDiv) {
                    equipTimingDiv.style.display = this.checked ? 'flex' : 'none';
                }
                update();
            };
            equipTimingToggleLabel.appendChild(equipTimingToggleCheckbox);
            equipTimingToggleLabel.appendChild(document.createTextNode(' Valor por Bloco de Tempo')); 
            itemDiv.appendChild(equipTimingToggleLabel);

            const itemEquipTimingDiv = document.createElement('div');
            itemEquipTimingDiv.className = 'item-equip-timing-options'; 
            itemEquipTimingDiv.id = `itemEquipTiming${currentItemIdx}`;
            itemEquipTimingDiv.style.display = 'none'; 

            const baseHoursEquipLabel = document.createElement('label');
            baseHoursEquipLabel.innerHTML = 'Horas Base:';
            const baseHoursEquipInput = document.createElement('input');
            baseHoursEquipInput.type = 'number';
            baseHoursEquipInput.id = `baseHoursEquip${currentItemIdx}`;
            baseHoursEquipInput.value = '4'; 
            baseHoursEquipInput.min = '0';
            baseHoursEquipInput.oninput = update;
            const baseHoursGroup = document.createElement('div'); baseHoursGroup.className="field-group-inline";
            baseHoursGroup.appendChild(baseHoursEquipLabel); baseHoursGroup.appendChild(baseHoursEquipInput);
            itemEquipTimingDiv.appendChild(baseHoursGroup);

            const extraTimeBlockEquipLabel = document.createElement('label');
            extraTimeBlockEquipLabel.innerHTML = 'Bloco Extra:';
            const extraTimeBlockEquipInput = document.createElement('input');
            extraTimeBlockEquipInput.type = 'number';
            extraTimeBlockEquipInput.id = `extraTimeBlockEquip${currentItemIdx}`;
            extraTimeBlockEquipInput.value = '1'; 
            extraTimeBlockEquipInput.min = '0.5';
            extraTimeBlockEquipInput.step = '0.5';
            extraTimeBlockEquipInput.oninput = update;
            const extraTimeBlockGroup = document.createElement('div'); extraTimeBlockGroup.className="field-group-inline";
            extraTimeBlockGroup.appendChild(extraTimeBlockEquipLabel); extraTimeBlockGroup.appendChild(extraTimeBlockEquipInput);
            itemEquipTimingDiv.appendChild(extraTimeBlockGroup);

            const extraCostBlockEquipLabel = document.createElement('label');
            extraCostBlockEquipLabel.innerHTML = 'Custo Bloco:';
            const extraCostBlockEquipInput = document.createElement('input');
            extraCostBlockEquipInput.type = 'number';
            extraCostBlockEquipInput.id = `extraCostBlockEquip${currentItemIdx}`;
            extraCostBlockEquipInput.value = '19'; 
            extraCostBlockEquipInput.min = '0';
            extraCostBlockEquipInput.oninput = update;
            const extraCostBlockGroup = document.createElement('div'); extraCostBlockGroup.className="field-group-inline";
            extraCostBlockGroup.appendChild(extraCostBlockEquipLabel); extraCostBlockGroup.appendChild(extraCostBlockEquipInput);
            itemEquipTimingDiv.appendChild(extraCostBlockGroup);

            const extraCostDiscountContainer = document.createElement('div');
            extraCostDiscountContainer.className = 'item-discount-container'; 
            extraCostDiscountContainer.style.display = 'flex';
            extraCostDiscountContainer.style.alignItems = 'center';
            extraCostDiscountContainer.style.gap = '10px';
            extraCostDiscountContainer.style.marginTop = '5px';

            const extraCostDiscountToggleLabel = document.createElement('label');
            extraCostDiscountToggleLabel.className = 'checkbox-label';
            const extraCostDiscountToggleCheckbox = document.createElement('input');
            extraCostDiscountToggleCheckbox.type = 'checkbox';
            extraCostDiscountToggleCheckbox.id = `extraCostDiscountToggle${currentItemIdx}`;
            
            const extraCostDiscountPercentageInput = document.createElement('input');
            extraCostDiscountPercentageInput.type = 'number';
            extraCostDiscountPercentageInput.id = `extraCostDiscountPercentage${currentItemIdx}`;
            extraCostDiscountPercentageInput.value = '15';
            extraCostDiscountPercentageInput.min = '0';
            extraCostDiscountPercentageInput.max = '100';
            extraCostDiscountPercentageInput.style.width = '70px';
            extraCostDiscountPercentageInput.style.marginLeft = '5px';
            extraCostDiscountPercentageInput.style.display = 'none';

            extraCostDiscountToggleCheckbox.onchange = function() {
                extraCostDiscountPercentageInput.style.display = this.checked ? 'inline-block' : 'none';
                if (!this.checked) extraCostDiscountPercentageInput.value = '15';
                update();
            };
            extraCostDiscountPercentageInput.oninput = update;

            extraCostDiscountToggleLabel.appendChild(extraCostDiscountToggleCheckbox);
            extraCostDiscountToggleLabel.appendChild(document.createTextNode(' Desconto Custo Extra (%)'));
            extraCostDiscountContainer.appendChild(extraCostDiscountToggleLabel);
            extraCostDiscountContainer.appendChild(extraCostDiscountPercentageInput);
            itemEquipTimingDiv.appendChild(extraCostDiscountContainer);

            itemDiv.appendChild(itemEquipTimingDiv);

            const itemDatesDiv = document.createElement('div');
            itemDatesDiv.className = 'item-options-row';
            itemDatesDiv.id = `itemDates${currentItemIdx}`;

            const fromDateLabel = document.createElement('label');
            fromDateLabel.innerHTML = 'De:';
            const fromDateInput = document.createElement('input');
            fromDateInput.type = 'date';
            fromDateInput.id = `itemFromDate${currentItemIdx}`;
            fromDateInput.onchange = update;
            fromDateLabel.appendChild(fromDateInput);
            itemDatesDiv.appendChild(fromDateLabel);

            const toDateLabel = document.createElement('label');
            toDateLabel.innerHTML = 'Até:';
            const toDateInput = document.createElement('input');
            toDateInput.type = 'date';
            toDateInput.id = `itemToDate${currentItemIdx}`;
            toDateInput.onchange = update;
            toDateLabel.appendChild(toDateInput);
            itemDatesDiv.appendChild(toDateLabel);

            const itemTimesDiv = document.createElement('div');
            itemTimesDiv.className = 'item-options-row';
            itemTimesDiv.id = `itemTimes${currentItemIdx}`;

            const fromTimeLabel = document.createElement('label');
            fromTimeLabel.innerHTML = 'Das:';
            const fromTimeInput = document.createElement('input');
            fromTimeInput.type = 'time';
            fromTimeInput.id = `itemFromTime${currentItemIdx}`;
            fromTimeInput.onchange = update;
            fromTimeLabel.appendChild(fromTimeInput);
            itemTimesDiv.appendChild(fromTimeLabel);

            const toTimeLabel = document.createElement('label');
            toTimeLabel.innerHTML = 'Às:';
            const toTimeInput = document.createElement('input');
            toTimeInput.type = 'time';
            toTimeInput.id = `itemToTime${currentItemIdx}`;
            toTimeInput.onchange = update;
            toTimeLabel.appendChild(toTimeInput);
            itemTimesDiv.appendChild(toTimeLabel);

            const itemOptionsContainer = document.createElement('div');
            itemOptionsContainer.className = 'item-options-container';
            itemOptionsContainer.id = `itemOptionsContainer${currentItemIdx}`;

            const dateTimeTitle = document.createElement('p');
            dateTimeTitle.className = 'item-section-title';
            dateTimeTitle.textContent = 'Período e Horário do Item';
            dateTimeTitle.id = `dateTimeTitle${currentItemIdx}`;
            itemOptionsContainer.appendChild(dateTimeTitle);

            itemOptionsContainer.appendChild(itemDatesDiv);
            itemOptionsContainer.appendChild(itemTimesDiv);
            itemDiv.appendChild(itemOptionsContainer);

            const outDiv = document.createElement('div');
            outDiv.id = `out${currentItemIdx}`;
            outDiv.className = 'out';
            itemDiv.appendChild(outDiv);
            
            itemsContainer.appendChild(itemDiv);
            
            const showItemDates = !document.getElementById('globalDatesApply').checked;
            const showItemTimes = !document.getElementById('globalTimesApply').checked;
            toggleItemSpecificOptions(currentItemIdx, showItemDates, showItemTimes);
            updateItemDateTimeSectionVisibility(currentItemIdx);

            idx++;
        }

        function removeItem(itemIndex) {
            const itemElement = document.getElementById('item' + itemIndex);
            if (itemElement) itemElement.remove();
            update();
        }

        function resetApp(isLoading = false) {
            document.getElementById('items').innerHTML = '';
            idx = 0; 
            document.getElementById('clientName').value = ''; 
            document.getElementById('sellerName').value = ''; 
            document.getElementById('fromDate').value = today();
            document.getElementById('toDate').value = today();
            document.getElementById('fromTime').value = '';
            document.getElementById('toTime').value = '';
            document.getElementById('globalDatesApply').checked = true; 
            document.getElementById('globalTimesApply').checked = true;
            document.getElementById('iva').checked = false;
            // document.getElementById('partner').checked = false;
            document.getElementById('discount').value = '';
            document.getElementById('transportLocation').value = "Nenhuma"; 
            document.getElementById('excludeDetailsCheckbox').checked = false;
            
            handleGlobalDatesApplyChange(); // Ensure correct display of item date fields
            handleGlobalTimesApplyChange(); // Ensure correct display of item time fields

            if (!isLoading) {
                addItem(); 
            } else {
                update(); // If loading, just update the empty summary
            }
        }

        function getDaysForItem(itemIndex) {
            const globalDatesApplyCheckbox = document.getElementById('globalDatesApply');
            let fromDateStr, toDateStr;

            if (globalDatesApplyCheckbox.checked) {
                fromDateStr = document.getElementById('fromDate').value;
                toDateStr = document.getElementById('toDate').value;
            } else {
                const itemFromDateInput = document.getElementById(`itemFromDate${itemIndex}`);
                const itemToDateInput = document.getElementById(`itemToDate${itemIndex}`);
                if (itemFromDateInput && itemToDateInput && itemFromDateInput.value && itemToDateInput.value) {
                    fromDateStr = itemFromDateInput.value;
                    toDateStr = itemToDateInput.value;
                } else { 
                    fromDateStr = document.getElementById('fromDate').value;
                    toDateStr = document.getElementById('toDate').value;
                }
            }

            if (!fromDateStr || !toDateStr) return 1; 
            const f = new Date(fromDateStr);
            const t = new Date(toDateStr);
            if (isNaN(f.getTime()) || isNaN(t.getTime())) return 1;
            const diffTime = t.getTime() - f.getTime();
            if (diffTime < 0) return 1; 
            const d = diffTime / (1000 * 60 * 60 * 24) + 1;
            return d > 0 ? Math.ceil(d) : 1; 
        }
        
        function getDurationInHours(fromTimeStr, toTimeStr) {
            if (!fromTimeStr || !toTimeStr) return 0; 
            const [fromHours, fromMinutes] = fromTimeStr.split(':').map(Number);
            const [toHours, toMinutes] = toTimeStr.split(':').map(Number);
            if (isNaN(fromHours) || isNaN(fromMinutes) || isNaN(toHours) || isNaN(toMinutes)) return 0;
            let fromTotalMinutes = fromHours * 60 + fromMinutes;
            let toTotalMinutes = toHours * 60 + toMinutes;
            if (toTotalMinutes < fromTotalMinutes) { 
                 toTotalMinutes += 24 * 60; 
            }
            const durationMinutes = toTotalMinutes - fromTotalMinutes;
            if (durationMinutes < 0) return 0; 
            return durationMinutes / 60;
        }

        function getOperationHoursForItem(itemIndex) {
            const globalTimesApplyCheckbox = document.getElementById('globalTimesApply');
            let fromTimeStr, toTimeStr;

            if (globalTimesApplyCheckbox.checked) {
                fromTimeStr = document.getElementById('fromTime').value;
                toTimeStr = document.getElementById('toTime').value;
            } else {
                const itemFromTimeInput = document.getElementById(`itemFromTime${itemIndex}`);
                const itemToTimeInput = document.getElementById(`itemToTime${itemIndex}`);
                 if (itemFromTimeInput && itemToTimeInput && itemFromTimeInput.value && itemToTimeInput.value) {
                    fromTimeStr = itemFromTimeInput.value;
                    toTimeStr = itemToTimeInput.value;
                } else { 
                    fromTimeStr = document.getElementById('fromTime').value;
                    toTimeStr = document.getElementById('toTime').value;
                }
            }
            return getDurationInHours(fromTimeStr, toTimeStr);
        }


        function update(isExport = false) {
            const showPricesWithoutIva = document.getElementById('iva').checked; 
            const globalDiscountPercent = parseFloat(document.getElementById('discount').value) || 0;

            let totalEquipBaseNet = 0; 
            let totalMonitorsBaseNet = 0;
            let totalEquipExtraTimeCostNet = 0; 

            for (let i = 0; i < idx; i++) {
                const nameInput = document.getElementById('name' + i);
                if (!nameInput) continue;
                
                const priceInput = document.getElementById('price' + i);
                const quantityInput = document.getElementById('quantity' + i);
                const monInput = document.getElementById('mon' + i);
                const monitorIncluidoCheckbox = document.getElementById(`monitorIncluido${i}`);
                const outputDiv = document.getElementById('out' + i);
                const equipTimingToggleCheckbox = document.getElementById(`equipTimingToggle${i}`);
                const baseHoursEquipInput = document.getElementById(`baseHoursEquip${i}`);
                const extraTimeBlockEquipInput = document.getElementById(`extraTimeBlockEquip${i}`);
                const extraCostBlockEquipInput = document.getElementById(`extraCostBlockEquip${i}`);

                if (!priceInput || !quantityInput || !monInput || !outputDiv || !monitorIncluidoCheckbox || 
                    !baseHoursEquipInput || !extraTimeBlockEquipInput || !extraCostBlockEquipInput || !equipTimingToggleCheckbox) {
                    continue;
                }

                const numDays = getDaysForItem(i); 
                const operationHours = getOperationHoursForItem(i); 
                const quantity = parseInt(quantityInput.value) || 1;
                
                let equipmentPriceForCalcIvaInclusive;
                const enteredPrice = parseFloat(priceInput.value) || 0;

                if (priceInput.dataset.manualOverride === 'true') {
                    if (priceInput.dataset.enteredWithIvaExclusive === 'true') {
                        equipmentPriceForCalcIvaInclusive = enteredPrice * (1 + IVA_RATE);
                    } else {
                        equipmentPriceForCalcIvaInclusive = enteredPrice;
                    }
                } else {
                    const predefinedData = equipmentData[nameInput.value.trim()];
                    if (predefinedData) {
                        equipmentPriceForCalcIvaInclusive = predefinedData.price;
                    } else {
                        equipmentPriceForCalcIvaInclusive = 0;
                    }
                }
                
                // This is the equipment's own daily price for its base included hours, after its own discount.
                let equipmentDailyPriceAfterDiscountsIvaInclusive = equipmentPriceForCalcIvaInclusive;
                
                const basePriceDiscountPercentageInput = document.getElementById(`discount${i}`);
                if (basePriceDiscountPercentageInput) {
                    const discountPercentage = parseFloat(basePriceDiscountPercentageInput.value) || 0;
                    if (discountPercentage > 0) {
                        equipmentDailyPriceAfterDiscountsIvaInclusive *= (1 - (discountPercentage / 100));
                    }
                }
                
                // This is used for accumulating the total base equipment cost for global discount calculation.
                const equipmentBasePriceDailyNet = equipmentDailyPriceAfterDiscountsIvaInclusive / (1 + IVA_RATE);
                totalEquipBaseNet += equipmentBasePriceDailyNet * numDays * quantity; 

                // This is the extra cost for time, after its own discount.
                let equipmentExtraCostDailyIvaInclusive = 0;
                let equipmentExtraCostDailyNet = 0;
                if (equipTimingToggleCheckbox.checked) { 
                    const baseHoursEquip = parseFloat(baseHoursEquipInput.value) || 0;
                    const extraTimeBlockEquip = parseFloat(extraTimeBlockEquipInput.value) || 1; 
                    const extraCostBlockEquip = parseFloat(extraCostBlockEquipInput.value) || 0;
                    
                    if (operationHours > baseHoursEquip && extraTimeBlockEquip > 0) {
                        const extraHoursEquip = operationHours - baseHoursEquip;
                        const numberOfExtraBlocksEquip = Math.ceil(extraHoursEquip / extraTimeBlockEquip); 
                        let currentExtraCostBlock = extraCostBlockEquip;

                        const extraCostDiscountToggle = document.getElementById(`extraCostDiscountToggle${i}`);
                        const extraCostDiscountPercentageInput = document.getElementById(`extraCostDiscountPercentage${i}`);
                        if (extraCostDiscountToggle && extraCostDiscountToggle.checked && extraCostDiscountPercentageInput) {
                            const discountPercentage = parseFloat(extraCostDiscountPercentageInput.value) || 0;
                            currentExtraCostBlock *= (1 - (discountPercentage / 100));
                        }
                        equipmentExtraCostDailyIvaInclusive = numberOfExtraBlocksEquip * currentExtraCostBlock;
                        equipmentExtraCostDailyNet = equipmentExtraCostDailyIvaInclusive / (1 + IVA_RATE);
                        totalEquipExtraTimeCostNet += equipmentExtraCostDailyNet * numDays * quantity; 
                    }
                }
                
                let monitorBasePriceForItemNet = 0; 
                const numMonitors = parseInt(monInput.value) || 0;
                if (numMonitors > 0 && !monitorIncluidoCheckbox.checked) {
                    const monitorBaseHours = 5;
                    const extraMonitorHours = Math.max(0, operationHours - monitorBaseHours); 
                    const calculatedExtraMonitorHoursCostIvaInclusive = Math.ceil(extraMonitorHours) * MONITOR_HOURLY_EXTRA_IVA_INCLUSIVE;
                    let monitorChargeIvaInclusive = (MONITOR_BASE_CHARGE_IVA_INCLUSIVE + calculatedExtraMonitorHoursCostIvaInclusive) * numMonitors;
                    monitorBasePriceForItemNet = monitorChargeIvaInclusive / (1 + IVA_RATE);
                }
                totalMonitorsBaseNet += monitorBasePriceForItemNet * numDays; // Não multiplica pelo quantity

                // Variables for display purposes
                let equipDisplayPerItemBaseDaily, equipDisplayPerItemExtraDaily;
                let equipTotalBaseForDisplay, equipTotalExtraForDisplay;

                if (showPricesWithoutIva) {
                    // Base display uses the equipment's own price (after its discount), net of IVA.
                    equipDisplayPerItemBaseDaily = equipmentBasePriceDailyNet; 
                    // Extra display uses the extra time cost (after its discount), net of IVA.
                    equipDisplayPerItemExtraDaily = equipmentExtraCostDailyNet;
                } else {
                    // Base display uses the equipment's own price (after its discount), with IVA.
                    equipDisplayPerItemBaseDaily = equipmentDailyPriceAfterDiscountsIvaInclusive; 
                    // Extra display uses the extra time cost (after its discount), with IVA.
                    equipDisplayPerItemExtraDaily = equipmentExtraCostDailyIvaInclusive;
                }

                equipTotalBaseForDisplay = equipDisplayPerItemBaseDaily * numDays * quantity;
                equipTotalExtraForDisplay = equipDisplayPerItemExtraDaily * numDays * quantity;

                let monitorDisplayPerItemDaily = showPricesWithoutIva ? monitorBasePriceForItemNet : monitorBasePriceForItemNet * (1 + IVA_RATE);
                
                const equipDisplayTotalForItem = equipTotalBaseForDisplay + equipTotalExtraForDisplay;
                const monitorDisplayTotalForItem = monitorDisplayPerItemDaily * numDays; // Não multiplica pelo quantity
                const totalItemDisplay = equipDisplayTotalForItem + monitorDisplayTotalForItem;

                let itemDetails = `Equip.: €${equipDisplayTotalForItem.toFixed(2)}`;
                itemDetails += ` (€${equipTotalBaseForDisplay.toFixed(2)} Base`;
                const basePriceDiscountElement = document.getElementById(`discount${i}`);
                const discountPercentage = basePriceDiscountElement ? (parseFloat(basePriceDiscountElement.value) || 0) : 0;
                if (discountPercentage > 0) {
                    itemDetails += ` [-${discountPercentage.toFixed(0)}%]`;
                }
                if (equipTimingToggleCheckbox.checked && equipmentExtraCostDailyIvaInclusive > 0) {
                     itemDetails += ` + €${equipTotalExtraForDisplay.toFixed(2)} Extra`;
                     const extraCostDiscountToggle = document.getElementById(`extraCostDiscountToggle${i}`);
                     const extraCostDiscountPercentageInput = document.getElementById(`extraCostDiscountPercentage${i}`);
                     if (extraCostDiscountToggle && extraCostDiscountToggle.checked && extraCostDiscountPercentageInput && parseFloat(extraCostDiscountPercentageInput.value) > 0) {
                        itemDetails += ` [-${parseFloat(extraCostDiscountPercentageInput.value).toFixed(0)}%]`;
                     }
                }
                itemDetails += `)`; 

                itemDetails += ` (${quantity > 1 ? quantity + 'x ' : ''}${numDays} dia(s)`;
                if (operationHours > 0) itemDetails += `, ${operationHours.toFixed(1)}h/dia`;
                itemDetails += `)\n`;
                
                if (numMonitors > 0) {
                    itemDetails += `Mon.: ${numMonitors} (€${monitorDisplayTotalForItem.toFixed(2)}`;
                    if (operationHours > 0) itemDetails += `, ${operationHours.toFixed(1)}h`;
                    if (monitorIncluidoCheckbox.checked) itemDetails += ", Incluído";
                    itemDetails += `)\n`;
                } else if (monitorIncluidoCheckbox.checked) { 
                     itemDetails += `Mon.: Incluído\n`;
                }

                itemDetails += `Total Item: €${totalItemDisplay.toFixed(2)}`;
                outputDiv.innerText = itemDetails;
            }

            const subTotalEquipMonitorsBaseNet = totalEquipBaseNet + totalMonitorsBaseNet; // This is just a sum before further specific breakdowns for summary display
            const transportFeeIvaInclusive = transportationFees[document.getElementById('transportLocation').value] || 0;
            const transportFeeBase = transportFeeIvaInclusive / (1 + IVA_RATE); 
            
            const subTotalBeforeGlobalDiscountBaseNet = totalEquipBaseNet; // Global discount applies ONLY to this base equipment sum
            const globalDiscountAmount = (subTotalBeforeGlobalDiscountBaseNet * (globalDiscountPercent / 100)); 
            const totalEquipBaseAfterGlobalDiscountNet = subTotalBeforeGlobalDiscountBaseNet - globalDiscountAmount;

            // Final total sums the discounted base equipment, plus non-discounted extra time, monitors, and transport
            const finalTotalBaseNet = totalEquipBaseAfterGlobalDiscountNet + totalEquipExtraTimeCostNet + totalMonitorsBaseNet + transportFeeBase; 
            
            const summaryElement = document.getElementById('summary');
            summaryElement.innerHTML = ''; 

            function appendSummaryLine(label, value, className = "") {
                const p = document.createElement("p");
                if (className) p.className = className;
                const formattedValue = typeof value === 'number' ? `€${value.toFixed(2)}` : value;
                p.innerHTML = `${label} <span>${formattedValue}</span>`;
                document.getElementById("summary").appendChild(p);
            }

            if (showPricesWithoutIva) {
                const equipEAnimacoesNet = totalEquipBaseNet + totalEquipExtraTimeCostNet;
                appendSummaryLine('Equipamentos e Animações', equipEAnimacoesNet);
                appendSummaryLine('Monitores', totalMonitorsBaseNet);
                if (transportFeeIvaInclusive > 0) {
                    appendSummaryLine('Transporte', transportFeeBase);
                }
                if (globalDiscountPercent > 0) {
                    const subtotalAllBeforeDiscount = equipEAnimacoesNet + totalMonitorsBaseNet + transportFeeBase;
                    appendSummaryLine('SUBTOTAL:', subtotalAllBeforeDiscount);
                    appendSummaryLine(`Desconto sobre o valor dos Equipamentos (${globalDiscountPercent.toFixed(1)}% s/ €${totalEquipBaseNet.toFixed(2)})`, -globalDiscountAmount, 'discount-line');
                }
                appendSummaryLine('VALOR FINAL (s/IVA)', finalTotalBaseNet, 'grand-total');
            } else { 
                const equipEAnimacoesComIva = (totalEquipBaseNet + totalEquipExtraTimeCostNet) * (1 + IVA_RATE);
                appendSummaryLine('Equipamentos e Animações', equipEAnimacoesComIva);
                appendSummaryLine('Monitores', totalMonitorsBaseNet * (1 + IVA_RATE));
                if (transportFeeIvaInclusive > 0) {
                    appendSummaryLine('Transporte', transportFeeIvaInclusive);
                }
                 if (globalDiscountPercent > 0) {
                    const subtotalAllBeforeDiscount = equipEAnimacoesComIva + (totalMonitorsBaseNet * (1+IVA_RATE)) + transportFeeIvaInclusive;
                    appendSummaryLine('SUBTOTAL:', subtotalAllBeforeDiscount);
                    appendSummaryLine(`Desconto sobre o valor dos Equipamentos (${globalDiscountPercent.toFixed(1)}% s/ €${(totalEquipBaseNet * (1+IVA_RATE)).toFixed(2)})`, -(globalDiscountAmount * (1 + IVA_RATE)), 'discount-line');
                }
                appendSummaryLine('VALOR FINAL (c/IVA)', finalTotalBaseNet * (1 + IVA_RATE), 'grand-total');
            }
        }

        async function buildQuoteHtml(quoteData = null) {
            console.log("[buildQuoteHtml] Building quote HTML...");

            // Use passed in quote data if available, otherwise use current form state
            const showPricesWithoutIva = quoteData ? quoteData.iva : document.getElementById('iva').checked;
            const globalDiscountPercent = quoteData ? parseFloat(quoteData.discount) || 0 : parseFloat(document.getElementById('discount').value) || 0;
            const selectedTransportLocation = quoteData ? quoteData.transportLocation : document.getElementById('transportLocation').value;
            const transportFeeIvaInclusive = transportationFees[selectedTransportLocation] || 0;
            const globalDatesApplied = quoteData ? quoteData.globalDatesApply : document.getElementById('globalDatesApply').checked;
            const globalTimesApplied = quoteData ? quoteData.globalTimesApply : document.getElementById('globalTimesApply').checked;
            const clientName = quoteData ? quoteData.clientName : document.getElementById('clientName').value.trim();
            const fromDateGlobal = quoteData ? quoteData.fromDate : document.getElementById('fromDate').value;
            const toDateGlobal = quoteData ? quoteData.toDate : document.getElementById('toDate').value;
            const fromTimeGlobalVal = quoteData ? quoteData.fromTime : document.getElementById('fromTime').value;
            const toTimeGlobalVal = quoteData ? quoteData.toTime : document.getElementById('toTime').value;
            const excludeDetails = quoteData ? false : document.getElementById('excludeDetailsCheckbox').checked;
            const sellerName = quoteData ? quoteData.sellerName : document.getElementById('sellerName').value.trim();

            const includeCondPagamento = quoteData ? quoteData.includeCondPagamentoExport : document.getElementById('includeCondPagamentoExport').checked;
            const includeMetPagamento = quoteData ? quoteData.includeMetPagamentoExport : document.getElementById('includeMetPagamentoExport').checked;
            let condPagamentoSelecionada = '';
            if (includeCondPagamento) {
                if (quoteData && quoteData.condPagamento) {
                    const conditionData = paymentConditionsData.find(c => c.value === quoteData.condPagamento);
                    if (conditionData) {
                        condPagamentoSelecionada = conditionData.exportText || conditionData.label;
                    }
                } else {
                    const condPagRadios = document.getElementsByName('condPagamento');
                    for (const radio of condPagRadios) {
                        if (radio.checked) {
                            const conditionData = paymentConditionsData.find(c => c.value === radio.value);
                            if (conditionData) {
                                condPagamentoSelecionada = conditionData.exportText || conditionData.label;
                            }
                            break;
                        }
                    }
                }
            }

            const metodosPagamentoSelecionados = [];
            if (includeMetPagamento) {
                if (quoteData) {
                    // Check payment methods from saved data
                    if (quoteData.metPagDinheiro) {
                        const dinheiro = paymentMethodsData.find(m => m.id === 'metPagDinheiro');
                        if (dinheiro) metodosPagamentoSelecionados.push(dinheiro.exportText || dinheiro.label);
                    }
                    if (quoteData.metPagMbway) {
                        const mbway = paymentMethodsData.find(m => m.id === 'metPagMbway');
                        if (mbway) metodosPagamentoSelecionados.push(mbway.exportText || mbway.label);
                    }
                    if (quoteData.metPagCheque) {
                        const cheque = paymentMethodsData.find(m => m.id === 'metPagCheque');
                        if (cheque) metodosPagamentoSelecionados.push(cheque.exportText || cheque.label);
                    }
                    if (quoteData.metPagTransf) {
                        const transf = paymentMethodsData.find(m => m.id === 'metPagTransf');
                        if (transf) metodosPagamentoSelecionados.push(transf.exportText || transf.label);
                    }
                } else {
                    // Get payment methods from form
                    paymentMethodsData.forEach(method => {
                        const checkbox = document.getElementById(method.id);
                        if (checkbox && checkbox.checked) {
                            metodosPagamentoSelecionados.push(method.exportText || method.label);
                        }
                    });
                }
            }

            let htmlContent = `
                     <style>
* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; font-size: 10pt; line-height: 1.4; } 
.export-container {
width: 180mm;
max-width: 180mm;
margin: 20mm auto; 
padding: 10mm;
background-color: #fff;
}
.export-logo { max-height: 100px; margin-bottom: 8mm; display: block; margin-left: auto; margin-right: auto;}
.header { text-align: center; padding-bottom: 8mm; border-bottom: 1px solid #ccc; margin-bottom: 8mm; }
.header h1 { margin: 0 0 4px 0; font-size: 20pt; color: #333; font-weight: bold; } 
.header .client-info { font-size: 11pt; color: #555; margin-top: 3px; text-align:center;}
.header .date-info { font-size: 11pt; color: #555; margin-top: 2px; text-align:center;}
.quote-details { margin-bottom: 8mm; padding-bottom: 4mm; border-bottom: 1px dashed #eee;}
.quote-details p { margin: 3px 0; font-size: 9pt; } 
.quote-details strong { font-weight: bold; }
.equipment-catalog-section { } 
.equipment-detail-item-wrapper { margin-bottom: 10mm; }
.equipment-detail-item { display: flex; flex-direction: row; align-items: flex-start; gap: 7mm; padding: 7mm 0; border-bottom: 1px dotted #e0e0e0; }
.equipment-detail-item:last-child { border-bottom: none; }
.equipment-detail-image-column { flex: 0 0 90mm; text-align: center; margin-top: 3mm; }
.equipment-detail-image-column img { max-width: 100%; max-height: 130mm; height: auto; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); object-fit: contain;}
.equipment-detail-info-column { flex: 1; text-align: left; }
.equipment-detail-info-column h2 { font-size: 15pt; color: #2c3e50; margin-top: 0; margin-bottom: 3mm; padding-bottom: 1.5mm; border-bottom: 1px solid #3498db; }
.equipment-detail-info-column .description { font-size: 9.5pt; color: #34495e; white-space: pre-line; line-height: 1.5;}
.summary-table-wrapper { padding-top:10mm;} 
table { width: 100%; border-collapse: collapse; margin-bottom: 15px; margin-top: 5mm; }
th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 9pt; vertical-align: top; } 
th { background-color: #f0f0f0; color: #333; font-weight: bold; text-transform: uppercase; font-size: 8pt;} 
tr:nth-child(even) td { background-color: #f9f9f9; }
td small { font-size: 0.85em; color: #555; display: block; margin-top: 1px;}
.summary-section { margin-top: 15px; padding: 12px; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 3px; }
.summary-section p { margin: 5px 0; font-size: 0.95em; } 
.summary-section strong { font-weight: bold; }
.summary-section .discount-line { font-size: 0.95em; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #d0d0d0;}
p.grand-total-final { font-size: 1em !important; font-weight: bold !important; color: #333 !important; margin-top: 7px !important; padding-top: 7px !important; border-top: 1px solid #aaa !important;}
p.grand-total-final strong { color: #333 !important; font-weight: bold !important; }
.footer { text-align: center; margin-top: 40px; padding: 20px 0; border-top: 2px solid #007bff; font-size: 1em; color: #555; page-break-inside: avoid !important; } 
.footer p { margin: 5px 0; font-size: 1.2em; }
.page-footer { margin-top: 40px !important; padding: 20px 0 !important; border-top: 2px solid #007bff !important; page-break-inside: avoid !important; }
.page-footer p { color: #333 !important; margin: 5px 0 !important; }
.page-footer p:first-child { color: #333 !important; font-weight: bold !important; font-size: 1.4em !important; }
.page-footer p:last-child { font-size: 1.2em !important; }
.seller-signature { margin-top: 10mm; padding-top: 5mm; border-top: 1px solid #ccc; font-size: 9pt; color: #555; white-space: pre-line; text-align: center; }
.item-notes { font-size: 0.9em; color: #555; margin-top: 10px; font-style: italic; } 
.general-conditions-section { margin-top: 15mm; padding-top: 5mm; border-top: 1px solid #ccc; font-size: 9pt; }
.general-conditions-section h3 { font-size: 11pt; color: #333; margin-bottom: 3mm; }
.general-conditions-section p, .general-conditions-section ul { margin-bottom: 2mm; line-height: 1.4; }
.general-conditions-section ul { padding-left: 5mm; list-style-type: disc; }
.general-conditions-section ul li { margin-bottom: 1mm; }

@media print { 
html, body {
    font-size: 10pt; 
    -webkit-print-color-adjust: exact; 
    print-color-adjust: exact;
    margin: 0; 
    padding: 0;
    height: auto !important;
    overflow: visible !important;
} 
.export-container { 
    box-shadow: none; 
    border: none;
    width: 180mm;
    margin: 20mm auto; 
    padding: 10mm; 
    background-color: #fff !important; 
    max-width: none; 
    height: auto !important;
    overflow: visible !important;
    page-break-inside: avoid !important;
}
.equipment-catalog-section { 
    page-break-after: auto; 
    page-break-inside: avoid !important;
} 
.equipment-detail-item-wrapper {
    page-break-after: auto !important; 
    page-break-inside: avoid !important; 
    margin-bottom: 10mm; 
}
.equipment-detail-item-wrapper:last-of-type {
    page-break-after: auto;
}
.equipment-detail-item {
    border-bottom: 1px dotted #eee; 
}
.equipment-detail-image-column img {
    max-width: 100%;
    max-height: 130mm;
}
.equipment-detail-info-column h2 {
        font-size: 13pt;
}
.equipment-detail-info-column .description {
    font-size: 9pt;
}
.summary-table-wrapper { 
    page-break-before: auto !important; 
}
table { font-size: 8pt; }
th, td { padding: 4px 6px; }
.summary-section { font-size: 0.9em; page-break-inside: avoid !important; }
.summary-section .grand-total-final { font-size: 0.95em; color: #333 !important; }
.summary-section .grand-total-final strong { color: #333 !important; } 
.page-footer { margin-top: 15mm !important; padding: 5mm 0 !important; border-top: 1pt solid #007bff !important; page-break-inside: avoid !important; text-align: center !important; }
.page-footer p { color: #333 !important; margin: 2mm 0 !important; }
.page-footer p:first-child { color: #333 !important; font-weight: bold !important; font-size: 12pt !important; }
.page-footer p:last-child { font-size: 10pt !important; }
.no-print { display: none !important; } 
}

.item-top-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    align-items: flex-end;
    margin-bottom: var(--spacing-md);
}

.name-field-container {
    flex: 1 1 250px; /* Grow, shrink, and base width */
}

.quantity-container,
.item-discount-container {
    flex-shrink: 0;
}

.quantity-container label,
.item-discount-container label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9rem;
    font-weight: 600;
}

.quantity-container input,
.item-discount-container input {
    width: 80px;
}
</style>`;
            htmlContent += `<div class="export-container">`;

            htmlContent += `<div class="header"><img src="imagens/logo.png" alt="My Dynamic Logo" class="export-logo" onerror="this.style.display='none';"><h1>Orçamento de Animação</h1>`;
            if (clientName) {
                htmlContent += `<p class="client-info">${clientName}</p>`;
            }
            if (globalDatesApplied && fromDateGlobal && toDateGlobal) {
                htmlContent += `<p class="date-info">Datas: De ${fromDateGlobal} até ${toDateGlobal}</p>`;
            }
            htmlContent += `</div>`;

            htmlContent += `<div class="quote-details">`;
            if (globalTimesApplied && (fromTimeGlobalVal || toTimeGlobalVal)) {
                htmlContent += `<p><strong>Horário:</strong> Das ${fromTimeGlobalVal || "N/A"} às ${toTimeGlobalVal || "N/A"}</p>`;
            }
            if (selectedTransportLocation !== "Nenhuma" && transportFeeIvaInclusive > 0) {
                htmlContent += `<p><strong>Localidade:</strong> ${selectedTransportLocation}</p>`;
            }
            htmlContent += `</div>`;

            if (!excludeDetails) {
                htmlContent += `<div class="equipment-catalog-section">`;
                            const itemsToProcess = quoteData ? quoteData.items : Array.from({length: idx}, (_, i) => {
                const nameInput = document.getElementById('name' + i);
                if (!nameInput) return null;
                return {
                    name: nameInput.value.trim(),
                    price: document.getElementById(`price${i}`).value,
                    quantity: document.getElementById(`quantity${i}`).value,
                    monitors: document.getElementById(`mon${i}`).value,
                    monitorIncluido: document.getElementById(`monitorIncluido${i}`).checked,
                    fromDate: document.getElementById(`itemFromDate${i}`).value,
                    toDate: document.getElementById(`itemToDate${i}`).value,
                    fromTime: document.getElementById(`itemFromTime${i}`).value,
                    toTime: document.getElementById(`itemToTime${i}`).value
                };
            }).filter(item => item && item.name);
            
            for (let i = 0; i < itemsToProcess.length; i++) {
                const item = itemsToProcess[i];
                const itemName = item.name;
                const details = equipmentData[itemName];
                if (details) {
                        htmlContent += `<div class="equipment-detail-item-wrapper">`;
                        htmlContent += `<div class="equipment-detail-item">`;
                        htmlContent += `<div class="equipment-detail-image-column">`;
                        if (details.image_url) {
                            const imageUrl = `imagens/${encodeURIComponent(details.image_url)}`;
                            htmlContent += `<img src="${imageUrl}" alt="Imagem de ${itemName}" onerror="this.style.display='none';">`;
                        } else {
                            htmlContent += `<p><em>(Sem imagem)</em></p>`;
                        }
                        htmlContent += `</div>`;
                        htmlContent += `<div class="equipment-detail-info-column">`;
                        htmlContent += `<h2>${itemName}</h2>`;
                        let descriptionText = details.description.replace(/\\n/g, '<br>');

                        htmlContent += `<div class="description">${descriptionText}</div>`;

                        htmlContent += `</div>`;
                        htmlContent += `</div>`;
                        htmlContent += `</div>`;
                    }
                }
                htmlContent += `</div>`;
             }

            htmlContent += `<div class="summary-table-wrapper">`;
            htmlContent += `<table><thead><tr>
                <th>Item</th>
                <th>Preço Unit. Dia</th>
                <th>Dias</th>
                ${!globalDatesApplied ? '<th>Período Item</th>' : ''}
                ${!globalTimesApplied ? '<th>Horário Item</th>' : ''}
                <th>Nº Monitores</th>
                <th>Duração (h)</th>
                <th>Subtotal Equip.</th>
                <th>Subtotal Monit.</th>
                <th>Total Item</th>
            </tr></thead><tbody>`;

            let overallTotalEquipBaseNetExport = 0;
            let overallTotalMonitorsBaseNetExport = 0;
            let overallTotalEquipExtraTimeCostNetExport = 0; // New for export

            for (let i = 0; i < itemsToProcess.length; i++) {
                const item = itemsToProcess[i];
                const itemName = item.name || "N/A";
                const priceInput = quoteData ? {value: item.price} : document.getElementById('price' + i);
                const monInput = quoteData ? {value: item.monitors} : document.getElementById('mon' + i);
                const monitorIncluidoCheckbox = quoteData ? {checked: item.monitorIncluido} : document.getElementById(`monitorIncluido${i}`);
                const baseHoursEquipInput = quoteData ? {value: item.baseHoursEquip} : document.getElementById(`baseHoursEquip${i}`);
                const equipTimingToggleCheckbox = quoteData ? {checked: item.equipTimingToggle} : document.getElementById(`equipTimingToggle${i}`);
                
                // Get quantity from saved quote or current form
                const quantity = quoteData ? parseInt(item.quantity) || 1 : parseInt(document.getElementById(`quantity${i}`)?.value) || 1;
                
                // Handle days calculation
                let numDaysForItem;
                let operationHours;
                
                if (quoteData) {
                    // Calculate days from saved data
                    const fromDate = globalDatesApplied ? fromDateGlobal : item.fromDate;
                    const toDate = globalDatesApplied ? toDateGlobal : item.toDate;
                    
                    if (fromDate && toDate) {
                        const f = new Date(fromDate);
                        const t = new Date(toDate);
                        if (!isNaN(f.getTime()) && !isNaN(t.getTime())) {
                            const diffTime = t.getTime() - f.getTime();
                            numDaysForItem = diffTime < 0 ? 1 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        } else {
                            numDaysForItem = 1;
                        }
                    } else {
                        numDaysForItem = 1;
                    }
                    
                    // Calculate hours from saved data
                    const fromTime = globalTimesApplied ? fromTimeGlobalVal : item.fromTime;
                    const toTime = globalTimesApplied ? toTimeGlobalVal : item.toTime;
                    
                    if (fromTime && toTime) {
                        const [fromHours, fromMinutes] = fromTime.split(':').map(Number);
                        const [toHours, toMinutes] = toTime.split(':').map(Number);
                        if (!isNaN(fromHours) && !isNaN(fromMinutes) && !isNaN(toHours) && !isNaN(toMinutes)) {
                            let fromTotalMinutes = fromHours * 60 + fromMinutes;
                            let toTotalMinutes = toHours * 60 + toMinutes;
                            if (toTotalMinutes < fromTotalMinutes) {
                                toTotalMinutes += 24 * 60;
                            }
                            operationHours = (toTotalMinutes - fromTotalMinutes) / 60;
                        } else {
                            operationHours = 0;
                        }
                    } else {
                        operationHours = 0;
                    }
                } else {
                    numDaysForItem = getDaysForItem(i);
                    operationHours = getOperationHoursForItem(i);
                }
                
                let itemPeriodText = '';
                if (!globalDatesApplied) {
                    const itemFromDateVal = quoteData ? item.fromDate || 'N/A' : document.getElementById(`itemFromDate${i}`)?.value || 'N/A';
                    const itemToDateVal = quoteData ? item.toDate || 'N/A' : document.getElementById(`itemToDate${i}`)?.value || 'N/A';
                    itemPeriodText = `<td>De ${itemFromDateVal}<br>Até ${itemToDateVal}</td>`;
                }
                let itemTimeText = '';
                if (!globalTimesApplied) {
                    const itemFromTimeVal = quoteData ? item.fromTime || 'N/A' : document.getElementById(`itemFromTime${i}`)?.value || 'N/A';
                    const itemToTimeVal = quoteData ? item.toTime || 'N/A' : document.getElementById(`itemToTime${i}`)?.value || 'N/A';
                    itemTimeText = `<td>${itemFromTimeVal} - ${itemToTimeVal}</td>`;
                }

                let equipmentOriginalDailyPriceIvaInclusive;
                const enteredPriceExport = parseFloat(priceInput.value) || 0;
                if (priceInput.dataset.manualOverride === 'true') {
                    if (priceInput.dataset.enteredWithIvaExclusive === 'true') {
                        equipmentOriginalDailyPriceIvaInclusive = enteredPriceExport * (1 + IVA_RATE);
                    } else {
                        equipmentOriginalDailyPriceIvaInclusive = enteredPriceExport;
                    }
                } else {
                    const predefinedData = equipmentData[itemName];
                    equipmentOriginalDailyPriceIvaInclusive = predefinedData ? predefinedData.price : 0;
                }

                let equipmentDailyPriceAfterDiscountIvaInclusive = equipmentOriginalDailyPriceIvaInclusive;

                // Apply base price discount for export
                let basePriceDiscountAppliedInfo = "";
                if (quoteData) {
                    // Use saved discount from quoteData
                    const discountPercentage = parseFloat(item.basePriceDiscountPercentage) || 0;
                    if (discountPercentage > 0) {
                        equipmentDailyPriceAfterDiscountIvaInclusive *= (1 - (discountPercentage / 100));
                        basePriceDiscountAppliedInfo = ` <small>(-${discountPercentage}%)</small>`;
                    }
                } else {
                    // Use discount from the current form
                    const basePriceDiscountPercentageInputExport = document.getElementById(`discount${i}`);
                    if (basePriceDiscountPercentageInputExport) {
                        const discountPercentage = parseFloat(basePriceDiscountPercentageInputExport.value) || 0;
                        if (discountPercentage > 0) {
                            equipmentDailyPriceAfterDiscountIvaInclusive *= (1 - (discountPercentage / 100));
                            basePriceDiscountAppliedInfo = ` <small>(-${discountPercentage}%)</small>`;
                        }
                    }
                }

                const equipmentBasePriceDailyIvaInclusiveExport = equipmentDailyPriceAfterDiscountIvaInclusive;
                const equipmentBasePriceDailyNetExport = equipmentBasePriceDailyIvaInclusiveExport / (1 + IVA_RATE);
                overallTotalEquipBaseNetExport += equipmentBasePriceDailyNetExport * numDaysForItem;

                let equipmentExtraCostDailyIvaInclusiveExport = 0;
                let equipmentExtraCostDailyNetExport = 0;
                let baseHoursEquipVal = 0;
                let extraCostAppliedInfo = ""; // For export table

                if (equipTimingToggleCheckbox.checked) {
                    baseHoursEquipVal = quoteData ? parseFloat(item.baseHoursEquip) || 0 : parseFloat(baseHoursEquipInput.value) || 0;
                    const extraTimeBlockEquip = quoteData ? parseFloat(item.extraTimeBlockEquip) || 1 : parseFloat(document.getElementById(`extraTimeBlockEquip${i}`).value) || 1;
                    const extraCostBlockEquip = quoteData ? parseFloat(item.extraCostBlockEquip) || 0 : parseFloat(document.getElementById(`extraCostBlockEquip${i}`).value) || 0;
                    if (operationHours > baseHoursEquipVal && extraTimeBlockEquip > 0) {
                        const extraHoursEquip = operationHours - baseHoursEquipVal;
                        const numberOfExtraBlocksEquip = Math.ceil(extraHoursEquip / extraTimeBlockEquip);
                        let currentExtraCostBlockForExport = extraCostBlockEquip;

                        // Apply extra cost discount for export
                        if (quoteData) {
                            // Use saved discount from quoteData
                            if (item.extraCostDiscountToggle) {
                                const discountPercentage = parseFloat(item.extraCostDiscountPercentage) || 0;
                                if (discountPercentage > 0) {
                                    currentExtraCostBlockForExport *= (1 - (discountPercentage / 100));
                                    extraCostAppliedInfo = ` <small>(-${discountPercentage}%)</small>`;
                                }
                            }
                        } else {
                            // Use discount from the current form
                            const extraCostDiscountToggleExport = document.getElementById(`extraCostDiscountToggle${i}`);
                            const extraCostDiscountPercentageInputExport = document.getElementById(`extraCostDiscountPercentage${i}`);
                            if (extraCostDiscountToggleExport && extraCostDiscountToggleExport.checked && extraCostDiscountPercentageInputExport) {
                                const discountPercentage = parseFloat(extraCostDiscountPercentageInputExport.value) || 0;
                                currentExtraCostBlockForExport *= (1 - (discountPercentage / 100));
                                if (discountPercentage > 0) extraCostAppliedInfo = ` <small>(-${discountPercentage}%)</small>`;
                            }
                        }
                        equipmentExtraCostDailyIvaInclusiveExport = numberOfExtraBlocksEquip * currentExtraCostBlockForExport;
                        equipmentExtraCostDailyNetExport = equipmentExtraCostDailyIvaInclusiveExport / (1 + IVA_RATE);
                        overallTotalEquipExtraTimeCostNetExport += equipmentExtraCostDailyNetExport * numDaysForItem;
                    }
                }
                const itemEquipTotalDisplayNet = equipmentBasePriceDailyNetExport + equipmentExtraCostDailyNetExport;
                const itemEquipTotalDisplayIvaIncl = equipmentBasePriceDailyIvaInclusiveExport + equipmentExtraCostDailyIvaInclusiveExport;
                const itemEquipTotalForTable = (showPricesWithoutIva ? itemEquipTotalDisplayNet : itemEquipTotalDisplayIvaIncl) * numDaysForItem * quantity;

                const priceUnitDayDisplay = showPricesWithoutIva ? equipmentBasePriceDailyNetExport : equipmentBasePriceDailyIvaInclusiveExport;
                const extraCostUnitDayDisplay = showPricesWithoutIva ? equipmentExtraCostDailyNetExport : equipmentExtraCostDailyIvaInclusiveExport;

                let monitorBasePriceForItemNetExport = 0;
                const numMonitorsExport = parseInt(monInput.value) || 0;
                if (numMonitorsExport > 0 && !monitorIncluidoCheckbox.checked) {
                    const monitorBaseHoursExport = 5;
                    const extraMonitorHoursExport = Math.max(0, operationHours - monitorBaseHoursExport);
                    const calculatedExtraMonitorHoursCostIvaInclusiveExport = Math.ceil(extraMonitorHoursExport) * MONITOR_HOURLY_EXTRA_IVA_INCLUSIVE;
                    let monitorChargeIvaInclusiveExport = (MONITOR_BASE_CHARGE_IVA_INCLUSIVE + calculatedExtraMonitorHoursCostIvaInclusiveExport) * numMonitorsExport;
                    monitorBasePriceForItemNetExport = monitorChargeIvaInclusiveExport / (1 + IVA_RATE);
                }
                overallTotalMonitorsBaseNetExport += monitorBasePriceForItemNetExport * numDaysForItem; // Não multiplica pela quantidade
                const itemMonitorTotalDisplay = (showPricesWithoutIva ? monitorBasePriceForItemNetExport : monitorBasePriceForItemNetExport * (1 + IVA_RATE)) * numDaysForItem;
                const totalItemForRowDisplay = itemEquipTotalForTable + itemMonitorTotalDisplay;
                htmlContent += `<tr>
                    <td>${itemName}</td>
                    <td>`;
                htmlContent += `€${priceUnitDayDisplay.toFixed(2)}${basePriceDiscountAppliedInfo}`;
                if (equipTimingToggleCheckbox.checked) {
                    htmlContent += ` <small>(Base ${baseHoursEquipVal}h)</small>`;
                    if (equipmentExtraCostDailyIvaInclusiveExport > 0) {
                        htmlContent += `<br>+ Extra €${extraCostUnitDayDisplay.toFixed(2)}${extraCostAppliedInfo} <small>(p/bloco)</small>`;
                    }
                }
                htmlContent += `</td>
                    <td>${numDaysForItem}</td>
                    ${itemPeriodText}
                    ${itemTimeText}
                    <td>${numMonitorsExport > 0 ? numMonitorsExport : "-"} ${monitorIncluidoCheckbox.checked && numMonitorsExport > 0 ? "<small>(Incluído)</small>" : ""} ${ (numMonitorsExport > 0 && operationHours > 0) ? `<small>(${operationHours.toFixed(1)}h)</small>` : ""}</td>
                    <td>${operationHours.toFixed(1)}h</td>
                    <td>€${itemEquipTotalForTable.toFixed(2)}</td>
                    <td>€${itemMonitorTotalDisplay.toFixed(2)}</td>
                    <td>€${totalItemForRowDisplay.toFixed(2)}</td>
                </tr>`;
            }
            htmlContent += `</tbody></table></div>`;

            const transportFeeBaseExport = transportFeeIvaInclusive / (1 + IVA_RATE);

            const subTotalBeforeGlobalDiscountNetExport = overallTotalEquipBaseNetExport; // Global discount applies only to this
            const globalDiscountAmountBaseExport = (subTotalBeforeGlobalDiscountNetExport * (globalDiscountPercent / 100));
            const totalAfterGlobalDiscountNetExport = subTotalBeforeGlobalDiscountNetExport - globalDiscountAmountBaseExport;

            const finalTotalBaseNetExport = totalAfterGlobalDiscountNetExport + overallTotalEquipExtraTimeCostNetExport + overallTotalMonitorsBaseNetExport + transportFeeBaseExport;
            const finalTotalExportDisplay = showPricesWithoutIva ? finalTotalBaseNetExport : finalTotalBaseNetExport * (1 + IVA_RATE);

            htmlContent += `<div class="summary-section"><p><strong>Resumo do Orçamento:</strong></p>`;
            const ivaTextForSummary = showPricesWithoutIva ? " +IVA" : "";

            const equipEAnimacoesNetExport = overallTotalEquipBaseNetExport + overallTotalEquipExtraTimeCostNetExport;
            const equipEAnimacoesComIvaExport = equipEAnimacoesNetExport * (1 + IVA_RATE);

            htmlContent += `<p>Equipamentos e Animações: €${(showPricesWithoutIva ? equipEAnimacoesNetExport : equipEAnimacoesComIvaExport).toFixed(2)}${ivaTextForSummary}</p>`;
            htmlContent += `<p>Total Monitores: €${(showPricesWithoutIva ? overallTotalMonitorsBaseNetExport : overallTotalMonitorsBaseNetExport * (1+IVA_RATE)).toFixed(2)}${ivaTextForSummary}</p>`;
            if (transportFeeIvaInclusive > 0) {
                htmlContent += `<p>Transporte (${selectedTransportLocation}): €${(showPricesWithoutIva ? transportFeeBaseExport : transportFeeIvaInclusive).toFixed(2)}${ivaTextForSummary}</p>`;
            }
            if (globalDiscountPercent > 0) {
                const subtotalAllBeforeDiscountExportNet = equipEAnimacoesNetExport + overallTotalMonitorsBaseNetExport + transportFeeBaseExport;
                const subtotalAllBeforeDiscountExportComIva = equipEAnimacoesComIvaExport + (overallTotalMonitorsBaseNetExport * (1 + IVA_RATE)) + transportFeeIvaInclusive;
                htmlContent += `<p>SUBTOTAL: €${(showPricesWithoutIva ? subtotalAllBeforeDiscountExportNet : subtotalAllBeforeDiscountExportComIva).toFixed(2)}${ivaTextForSummary}</p>`;

                const baseValueForDiscountTextNet = overallTotalEquipBaseNetExport;
                const baseValueForDiscountTextComIva = overallTotalEquipBaseNetExport * (1 + IVA_RATE);
                htmlContent += `<p class="discount-line">Desconto sobre o valor dos Equipamentos (${globalDiscountPercent}% s/ €${(showPricesWithoutIva ? baseValueForDiscountTextNet : baseValueForDiscountTextComIva).toFixed(2)}): -€${(showPricesWithoutIva ? globalDiscountAmountBaseExport : globalDiscountAmountBaseExport * (1+IVA_RATE)).toFixed(2)}${ivaTextForSummary}</p>`;
            }
            htmlContent += `<p class="grand-total-final"><strong>VALOR FINAL: €${finalTotalExportDisplay.toFixed(2)}</strong></p>`;
            if (showPricesWithoutIva) {
                htmlContent += `<p class="item-notes">A todos os valores apresentados acresce IVA à taxa legal em vigor (${(IVA_RATE*100).toFixed(0)}%).</p>`;
            } else {
                htmlContent += `<p class="item-notes">Valores com IVA incluído à taxa legal em vigor (${(IVA_RATE*100).toFixed(0)}%).</p>`;
            }
            htmlContent += `</div>`;

            htmlContent += `<div class="general-conditions-section">`;
            htmlContent += `<h3>Condições Gerais:</h3>`;
            htmlContent += `<ul>`;
            if (showPricesWithoutIva) {
                htmlContent += `<li>A todos os valores acima mencionados acresce IVA à taxa legal em vigor (${(IVA_RATE*100).toFixed(0)}%).</li>`;
            } else {
                htmlContent += `<li>Os valores apresentados já incluem o IVA à taxa legal em vigor (${(IVA_RATE*100).toFixed(0)}%).</li>`;
            }
            htmlContent += `<li>O local da actividade será a designar atempadamente pelo Cliente.</li>`;
            htmlContent += `<li>Os valores apresentados são válidos durante o ano de 2025.</li>`;
            htmlContent += `<li>A disponibilidade das actividades referidas nesta proposta só poderá ser confirmada aquando da adjudicação por escrito.</li>`;
            htmlContent += `</ul>`;

            if (includeCondPagamento && condPagamentoSelecionada) {
                htmlContent += `<h3>Condições de Pagamento:</h3>`;
                htmlContent += `<p>${condPagamentoSelecionada}</p>`;
            }

            if (includeMetPagamento && metodosPagamentoSelecionados.length > 0) {
                htmlContent += `<h3>Método de pagamento:</h3>`;
                htmlContent += `<p>O pagamento no valor total de €${finalTotalExportDisplay.toFixed(2)} deverá ser efetuado até ao ato da montagem numa das seguintes formas:</p>`;
                htmlContent += `<ul>`;
                metodosPagamentoSelecionados.forEach(metodo => {
                    htmlContent += `<li>${metodo}</li>`;
                });
                htmlContent += `</ul>`;
                htmlContent += `<p>Caso pretenda número de contribuinte na fatura, por favor, envie-nos os seus dados fiscais.</p>`;
            }
            
            // Add company info here - guaranteed to be included in PDF
            htmlContent += `<div style="margin-top: 30px; padding: 15px 0; text-align: center; border-top: 1px solid #ddd;"><p style="font-size: 1.4em; font-weight: bold; margin: 0 0 8px 0; color: #333;">MY DYNAMIC</p><p style="font-size: 1.2em; margin: 0; color: #333;">www.dynamickids.pt</p></div>`;
            
            htmlContent += `</div>`;

            const sellerSignatureDetails = sellerSignatures[sellerName];
            if (sellerSignatureDetails) {
                htmlContent += `<div class="seller-signature">${sellerSignatureDetails.replace(/\\n/g, '<br>')}</div>`;
            }
            htmlContent += `</div>`;
            
            htmlContent += `</div>`;

            return htmlContent;
        }

        async function exportToPrintable() {
            console.log("[exportToPrintable] Iniciando geração de PDF...");

            const exportButton = document.querySelector('.export');
            const originalButtonText = exportButton ? exportButton.textContent : 'Exportar';
            let printContainer; // Define printContainer here to be accessible in finally block

            if (exportButton) {
                exportButton.textContent = 'A gerar...';
                exportButton.disabled = true;
            }

            try {
                const htmlContent = buildQuoteHtml();

                printContainer = document.createElement('div');
                printContainer.style.position = 'absolute';
                printContainer.style.left = '-9999px';
                printContainer.style.top = '0';
                document.body.appendChild(printContainer);
                printContainer.innerHTML = htmlContent;

                const images = Array.from(printContainer.querySelectorAll('img'));
                const promises = images.map(img => new Promise(resolve => {
                    if (img.complete || (img.naturalWidth === 0 && img.naturalHeight === 0 && img.src)) {
                        resolve();
                    } else {
                        img.onload = resolve;
                        img.onerror = () => {
                            console.warn(`Could not load image: ${img.src}`);
                            resolve();
                        };
                    }
                }));

                await Promise.all(promises);

                const elementToPrint = printContainer.querySelector('.export-container');
                if (!elementToPrint) {
                    throw new Error("Could not find the .export-container element to print.");
                }

                // Wait for content to render properly
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Calculate proper height including all content
                const actualHeight = Math.max(
                    elementToPrint.scrollHeight,
                    elementToPrint.offsetHeight,
                    elementToPrint.clientHeight
                );
                
                const canvas = await html2canvas(elementToPrint, {
                    scale: 1.3, // Good quality
                    useCORS: true,
                    allowTaint: true,
                    height: actualHeight + 50, // Small margin for safety
                    width: elementToPrint.scrollWidth,
                    scrollX: 0,
                    scrollY: 0,
                    backgroundColor: '#ffffff',
                    imageTimeout: 4000,
                    removeContainer: true,
                    windowWidth: 1200,
                    windowHeight: actualHeight + 100,
                    logging: false,
                    foreignObjectRendering: false
                });

                // Use JPEG instead of PNG for smaller file size and faster processing
                const imgData = canvas.toDataURL('image/jpeg', 0.92); // 92% quality JPEG
                const {
                    jsPDF
                } = window.jspdf;

                let pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(imgData);

                const pdfWidth = pdf.internal.pageSize.getWidth();
                let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                // Ensure minimum height and add generous padding for footer
                const minHeight = pdf.internal.pageSize.getHeight();
                pdfHeight = Math.max(pdfHeight + 30, minHeight); // Add 30mm extra for footer

                pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight],
                    compress: true
                });

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight); // Include full height

                const clientName = document.getElementById('clientName').value.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'orcamento';
                const date = new Date().toISOString().slice(0, 10);
                pdf.save(`${clientName}_${date}.pdf`);

            } catch (error) {
                console.error("Erro ao gerar PDF:", error);
                alert(`Ocorreu um erro ao gerar o PDF: ${error.message}`);
            } finally {
                if (exportButton) {
                    exportButton.textContent = originalButtonText;
                    exportButton.disabled = false;
                }
                if (printContainer && printContainer.parentNode) {
                    printContainer.parentNode.removeChild(printContainer);
                }
            }
        }

        function exportQuote() {
            exportToPrintable();
        }

        function getQuoteDataForSave() {
            const items = [];
            for (let i = 0; i < idx; i++) {
                const itemDiv = document.getElementById(`item${i}`);
                if (itemDiv) {
                    const nameInput = document.getElementById(`name${i}`);
                    if (nameInput && nameInput.value.trim() !== "") {
                        items.push({
                            name: nameInput.value,
                            quantity: document.getElementById(`quantity${i}`).value,
                            price: document.getElementById(`price${i}`).value,
                            basePriceDiscountPercentage: document.getElementById(`discount${i}`).value,
                            equipTimingToggle: document.getElementById(`equipTimingToggle${i}`).checked,
                            baseHoursEquip: document.getElementById(`baseHoursEquip${i}`).value,
                            extraTimeBlockEquip: document.getElementById(`extraTimeBlockEquip${i}`).value,
                            extraCostBlockEquip: document.getElementById(`extraCostBlockEquip${i}`).value,
                            extraCostDiscountToggle: document.getElementById(`extraCostDiscountToggle${i}`).checked,
                            extraCostDiscountPercentage: document.getElementById(`extraCostDiscountPercentage${i}`).value,
                            fromDate: document.getElementById(`itemFromDate${i}`).value,
                            toDate: document.getElementById(`itemToDate${i}`).value,
                            fromTime: document.getElementById(`itemFromTime${i}`).value,
                            toTime: document.getElementById(`itemToTime${i}`).value,
                            monitors: document.getElementById(`mon${i}`).value,
                            monitorIncluido: document.getElementById(`monitorIncluido${i}`).checked
                        });
                    }
                }
            }
        
            return {
                clientName: document.getElementById('clientName').value,
                sellerName: document.getElementById('sellerName').value,
                fromDate: document.getElementById('fromDate').value,
                toDate: document.getElementById('toDate').value,
                fromTime: document.getElementById('fromTime').value,
                toTime: document.getElementById('toTime').value,
                globalDatesApply: document.getElementById('globalDatesApply').checked,
                globalTimesApply: document.getElementById('globalTimesApply').checked,
                iva: document.getElementById('iva').checked,
                discount: document.getElementById('discount').value,
                transportLocation: document.getElementById('transportLocation').value,
                includeCondPagamentoExport: document.getElementById('includeCondPagamentoExport').checked,
                condPagamento: document.querySelector('input[name="condPagamento"]:checked')?.value,
                includeMetPagamentoExport: document.getElementById('includeMetPagamentoExport').checked,
                metPagDinheiro: document.getElementById('metPagDinheiro')?.checked,
                metPagMbway: document.getElementById('metPagMbway')?.checked,
                metPagCheque: document.getElementById('metPagCheque')?.checked,
                metPagTransf: document.getElementById('metPagTransf')?.checked,
                items: items,
            };
        }
        
        function saveQuote() {
            const clientNameInput = document.getElementById('clientName');
            const currentDate = new Date().toLocaleDateString('pt-PT');
            const defaultPromptValue = clientNameInput.value || currentDate;
            const clientName = prompt("Por favor, insira o nome do cliente para este orçamento:", defaultPromptValue);
            
            if (clientName === null || clientName.trim() === "") {
                if (clientName !== null) {
                     alert("O nome do cliente não pode estar em branco.");
                }
                return;
            }

            const trimmedClientName = clientName.trim();
            const savedQuotes = JSON.parse(localStorage.getItem('saved_quotes')) || [];
            const existingQuoteIndex = savedQuotes.findIndex(q => q.clientName === trimmedClientName);

            const quoteState = getQuoteDataForSave();
            quoteState.clientName = trimmedClientName;
            quoteState.dateSaved = new Date().toISOString();

            if (existingQuoteIndex !== -1) {
                // Overwrite existing quote
                quoteState.id = savedQuotes[existingQuoteIndex].id; // Keep the original ID
                savedQuotes[existingQuoteIndex] = quoteState;
                alert(`Orçamento para "${trimmedClientName}" atualizado com sucesso!`);
            } else {
                // Create new quote
                quoteState.id = Date.now();
                savedQuotes.push(quoteState);
                alert(`Orçamento para "${trimmedClientName}" guardado com sucesso!`);
            }

            localStorage.setItem('saved_quotes', JSON.stringify(savedQuotes));
            displaySavedQuotes();
        }

        function displaySavedQuotes() {
            const savedQuotes = JSON.parse(localStorage.getItem('saved_quotes')) || [];
            const listContainer = document.getElementById('savedQuotationsList');
            listContainer.innerHTML = '';

            if (savedQuotes.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #777;">Não há orçamentos guardados.</p>';
                return;
            }

            savedQuotes.forEach(quote => {
                const quoteEl = document.createElement('div');
                quoteEl.className = 'saved-quote-item';
                quoteEl.onclick = () => viewQuote(quote.id);

                const date = new Date(quote.dateSaved).toLocaleDateString('pt-PT', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });

                const quoteInfo = document.createElement('div');
                quoteInfo.className = 'saved-quote-info';
                quoteInfo.textContent = `${quote.clientName || 'Orçamento Sem Nome'} - ${date}`;

                const quoteActions = document.createElement('div');
                quoteActions.className = 'saved-quote-actions';

                const viewButton = document.createElement('button');
                viewButton.innerHTML = '<i class="fas fa-eye"></i>';
                viewButton.title = 'Ver Orçamento';
                viewButton.onclick = (e) => {
                    e.stopPropagation();
                    viewQuote(quote.id);
                };

                const loadButton = document.createElement('button');
                loadButton.innerHTML = '<i class="fas fa-upload"></i>';
                loadButton.title = 'Carregar Orçamento';
                loadButton.onclick = (e) => {
                    e.stopPropagation();
                    loadQuote(quote.id);
                };

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-btn';
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteButton.title = 'Apagar Orçamento';
                deleteButton.onclick = (e) => {
                    e.stopPropagation();
                    deleteQuote(quote.id);
                };

                quoteActions.appendChild(viewButton);
                quoteActions.appendChild(loadButton);
                quoteActions.appendChild(deleteButton);

                quoteEl.appendChild(quoteInfo);
                quoteEl.appendChild(quoteActions);
                listContainer.appendChild(quoteEl);
            });
        }
        
        async function openQuoteInNewWindow(quoteData) {
            const quoteWindow = window.open('', '_blank');
            if (!quoteWindow) {
                alert("Pop-up bloqueado. Por favor, permita pop-ups para este site.");
                return;
            }

            const quoteHtml = await buildQuoteHtml(quoteData);

            if (quoteWindow) {
                quoteWindow.document.write('<html><head><title>Visualizar Orçamento</title></head><body></body></html>');
                quoteWindow.document.close();

                const jspdfScript = quoteWindow.document.createElement('script');
                jspdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                quoteWindow.document.head.appendChild(jspdfScript);

                const html2canvasScript = quoteWindow.document.createElement('script');
                html2canvasScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                quoteWindow.document.head.appendChild(html2canvasScript);

                quoteWindow.document.body.innerHTML = quoteHtml;
                
                html2canvasScript.onload = () => {
                    const downloadBtn = quoteWindow.document.createElement('button');
                    downloadBtn.textContent = 'Download PDF';
                    downloadBtn.style.position = 'fixed';
                    downloadBtn.style.top = '10px';
                    downloadBtn.style.right = '10px';
                    downloadBtn.style.padding = '10px 15px';
                    downloadBtn.style.border = 'none';
                    downloadBtn.style.backgroundColor = '#005A9C';
                    downloadBtn.style.color = 'white';
                    downloadBtn.style.borderRadius = '5px';
                    downloadBtn.style.cursor = 'pointer';
                    downloadBtn.style.zIndex = '10000';
                    downloadBtn.classList.add('no-print');
                    
                    downloadBtn.onclick = async () => {
                        downloadBtn.textContent = 'A gerar...';
                        downloadBtn.disabled = true;
                        try {
                            const elementToPrint = quoteWindow.document.querySelector('.export-container');
                             const canvas = await quoteWindow.html2canvas(elementToPrint, {
                                scale: 2,
                                useCORS: true,
                                allowTaint: true,
                            });

                            const imgData = canvas.toDataURL('image/png');
                            const { jsPDF } = quoteWindow.jspdf;

                            let pdf = new jsPDF('p', 'mm', 'a4');
                            const imgProps = pdf.getImageProperties(imgData);
                            const pdfWidth = pdf.internal.pageSize.getWidth();
                            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                            pdf = new jsPDF({
                                orientation: 'p',
                                unit: 'mm',
                                format: [pdfWidth, pdfHeight]
                            });

                            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                            const clientName = (quoteData.clientName || 'orcamento').trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
                            const date = new Date().toISOString().slice(0, 10);
                            pdf.save(`${clientName}_${date}.pdf`);

                        } catch (error) {
                             console.error("Erro ao gerar PDF na janela de visualização:", error);
                             alert("Ocorreu um erro ao gerar o PDF.");
                        } finally {
                            downloadBtn.textContent = 'Download PDF';
                            downloadBtn.disabled = false;
                        }
                    };

                    quoteWindow.document.body.appendChild(downloadBtn);
                };
                
                quoteWindow.focus();
            } else {
                alert("Pop-up bloqueado. Por favor, permita pop-ups para este site.");
            }
        }

        async function viewQuote(quoteId) {
            const savedQuotes = JSON.parse(localStorage.getItem('saved_quotes')) || [];
            const quoteToView = savedQuotes.find(q => q.id === quoteId);

            if (!quoteToView) {
                alert("Orçamento para visualização não encontrado.");
                return;
            }
            
            console.log("Viewing quote:", quoteToView);
            await openQuoteInNewWindow(quoteToView);
        }

        function applyQuoteDataToForm(data) {
             if (!data) {
                console.error("No data provided to applyQuoteDataToForm");
                return;
            }

            resetAll(true); // Reset form before loading new data

            document.getElementById('clientName').value = data.clientName || '';
            document.getElementById('sellerName').value = data.sellerName || '';
            document.getElementById('fromDate').value = data.fromDate || today();
            document.getElementById('toDate').value = data.toDate || today();
            document.getElementById('fromTime').value = data.fromTime || '';
            document.getElementById('toTime').value = data.toTime || '';
            document.getElementById('globalDatesApply').checked = data.globalDatesApply;
            document.getElementById('globalTimesApply').checked = data.globalTimesApply;
            document.getElementById('iva').checked = data.iva;
            document.getElementById('discount').value = data.discount || 0;
            document.getElementById('transportLocation').value = data.transportLocation || 'Nenhuma';
            
            document.getElementById('includeCondPagamentoExport').checked = data.includeCondPagamentoExport;
            if (data.condPagamento) {
                const condRadio = document.querySelector(`input[name="condPagamento"][value="${data.condPagamento}"]`);
                if (condRadio) condRadio.checked = true;
            }
            document.getElementById('includeMetPagamentoExport').checked = data.includeMetPagamentoExport;
            if(document.getElementById('metPagDinheiro')) document.getElementById('metPagDinheiro').checked = data.metPagDinheiro;
            if(document.getElementById('metPagMbway')) document.getElementById('metPagMbway').checked = data.metPagMbway;
            if(document.getElementById('metPagCheque')) document.getElementById('metPagCheque').checked = data.metPagCheque;
            if(document.getElementById('metPagTransf')) document.getElementById('metPagTransf').checked = data.metPagTransf;

            if (data.items && data.items.length > 0) {
                data.items.forEach(itemData => {
                    addItem(); 
                    const currentIdx = idx - 1;
                    
                    document.getElementById(`name${currentIdx}`).value = itemData.name;
                    if (itemData.quantity) {
                        document.getElementById(`quantity${currentIdx}`).value = itemData.quantity;
                    }
                    checkPredefinedPrice(currentIdx); 
                    document.getElementById(`price${currentIdx}`).value = itemData.price;
                    
                    const priceInput = document.getElementById(`price${currentIdx}`);
                    const predefinedPrice = parseFloat(priceInput.dataset.originalIvaInclusivePrice);
                    if (isNaN(predefinedPrice) || parseFloat(itemData.price) !== predefinedPrice) {
                        priceInput.dataset.manualOverride = 'true';
                    }

                    // Set the discount value
                    document.getElementById(`discount${currentIdx}`).value = itemData.basePriceDiscountPercentage || '0';
                    document.getElementById(`equipTimingToggle${currentIdx}`).checked = itemData.equipTimingToggle;
                    document.getElementById(`baseHoursEquip${currentIdx}`).value = itemData.baseHoursEquip;
                    document.getElementById(`extraTimeBlockEquip${currentIdx}`).value = itemData.extraTimeBlockEquip;
                    document.getElementById(`extraCostBlockEquip${currentIdx}`).value = itemData.extraCostBlockEquip;
                    document.getElementById(`extraCostDiscountToggle${currentIdx}`).checked = itemData.extraCostDiscountToggle;
                    document.getElementById(`extraCostDiscountPercentage${currentIdx}`).value = itemData.extraCostDiscountPercentage;
                    document.getElementById(`itemFromDate${currentIdx}`).value = itemData.fromDate;
                    document.getElementById(`itemToDate${currentIdx}`).value = itemData.toDate;
                    document.getElementById(`itemFromTime${currentIdx}`).value = itemData.fromTime;
                    document.getElementById(`itemToTime${currentIdx}`).value = itemData.toTime;
                    document.getElementById(`mon${currentIdx}`).value = itemData.monitors;
                    document.getElementById(`monitorIncluido${currentIdx}`).checked = itemData.monitorIncluido;
                    document.getElementById(`equipTimingToggle${currentIdx}`).dispatchEvent(new Event('change'));
                });
            } else if (idx === 0) { // If there are no items to load, ensure there is one blank item
                addItem();
            }
            
            handleGlobalDatesApplyChange();
            handleGlobalTimesApplyChange();

            update();
            
            document.querySelector('.tab-link[data-tab="calculator"]').click();
            alert(`Orçamento para "${data.clientName}" carregado.`);
        }

        async function loadQuote(quoteId) {
            const savedQuotes = JSON.parse(localStorage.getItem('saved_quotes')) || [];
            const data = savedQuotes.find(q => q.id === quoteId);

            if (!data) {
                alert("Orçamento não encontrado.");
                return;
            }
            
            applyQuoteDataToForm(data);

            await new Promise(resolve => setTimeout(resolve, 100));
            
            document.querySelector('.tab-link[data-tab="calculator"]').click();
            alert(`Orçamento para "${data.clientName}" carregado para edição.`);
        }

        function deleteQuote(quoteId) {
            if (!confirm("Tem a certeza que quer apagar este orçamento?")) {
                return;
            }

            let savedQuotes = JSON.parse(localStorage.getItem('saved_quotes')) || [];
            savedQuotes = savedQuotes.filter(q => q.id !== quoteId);
            localStorage.setItem('saved_quotes', JSON.stringify(savedQuotes));

            displaySavedQuotes();
        }

        function resetAll(isLoading = false) {
            document.getElementById('items').innerHTML = '';
            idx = 0;
            document.getElementById('clientName').value = ''; 
            document.getElementById('sellerName').value = ''; 
            document.getElementById('fromDate').value = today();
            document.getElementById('toDate').value = today();
            document.getElementById('fromTime').value = '';
            document.getElementById('toTime').value = '';
            document.getElementById('globalDatesApply').checked = true; 
            document.getElementById('globalTimesApply').checked = true;
            document.getElementById('iva').checked = false;
            document.getElementById('discount').value = '';
            document.getElementById('transportLocation').value = "Nenhuma"; 
            document.getElementById('excludeDetailsCheckbox').checked = false;
            
            document.getElementById('includeCondPagamentoExport').checked = true;
            if(document.getElementById('condPag5050')) document.getElementById('condPag5050').checked = true;
            
            document.getElementById('includeMetPagamentoExport').checked = true;
            if(document.getElementById('metPagDinheiro')) document.getElementById('metPagDinheiro').checked = true;
            if(document.getElementById('metPagMbway')) document.getElementById('metPagMbway').checked = true;
            if(document.getElementById('metPagCheque')) document.getElementById('metPagCheque').checked = true;
            if(document.getElementById('metPagTransf')) document.getElementById('metPagTransf').checked = true;

            handleGlobalDatesApplyChange();
            handleGlobalTimesApplyChange();

            if (!isLoading) {
                addItem();
            }
            update();
        }

        function checkPasswordAndShowApp() {
            const passwordInput = document.getElementById('passwordInput');
            const passwordError = document.getElementById('passwordError');
            
            // Check if there's a saved password first
            const savedPassword = localStorage.getItem('calculatorPassword');
            if (savedPassword === CORRECT_PASSWORD) {
                passwordError.style.display = 'none';
                document.getElementById('passwordSection').style.display = 'none';
                document.getElementById('appContainer').style.display = 'block';
                document.body.style.alignItems = 'flex-start'; 
                document.body.style.justifyContent = 'flex-start'; 
                document.body.style.minHeight = 'auto'; 
                
                // Inicializar app apenas se ainda não foi inicializado
                if (!window.appInitialized) {
                    initializeApp();
                    window.appInitialized = true;
                }
                
                setupBackToTopButton();
                return true;
            }
            
            // Only check typed password if user has entered something
            if (passwordInput && passwordInput.value.length > 0) {
                if (passwordInput.value === CORRECT_PASSWORD) {
                    localStorage.setItem('calculatorPassword', CORRECT_PASSWORD);
                    passwordError.style.display = 'none';
                    document.getElementById('passwordSection').style.display = 'none';
                    document.getElementById('appContainer').style.display = 'block';
                    document.body.style.alignItems = 'flex-start'; 
                    document.body.style.justifyContent = 'flex-start'; 
                    document.body.style.minHeight = 'auto'; 
                    
                    // Inicializar app apenas se ainda não foi inicializado
                    if (!window.appInitialized) {
                        initializeApp();
                        window.appInitialized = true;
                    }
                    
                    setupBackToTopButton();
                    return true;
                } else {
                    // Only show error if user actually tried to enter a password
                    passwordError.style.display = 'block';
                    passwordInput.value = '';
                    passwordInput.focus();
                    localStorage.removeItem('calculatorPassword');
                    return false;
                }
            }
            
            // No password entered yet, don't show error
            passwordError.style.display = 'none';
            return false;
        }

        async function initializeApp() {
            console.log("Initializing app...");
            
            // Show loading state
            const appContainer = document.querySelector('.container') || document.body;
            const originalContent = appContainer.innerHTML;
            
            // Try to load data, with a small delay to allow server to be ready
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const results = await Promise.allSettled([
                fetchEquipmentData(),
                fetchTransportationFees(),
                fetchPaymentConditions(),
                fetchPaymentMethods()
            ]);
            
            // Check if any critical data failed to load
            const failedLoads = results.filter(result => result.status === 'rejected' || result.value === false);
            if (failedLoads.length > 0) {
                console.log(`${failedLoads.length} data sources failed to load initially. Retrying in background...`);
                
                // Retry failed loads in background without blocking UI
                setTimeout(async () => {
                    console.log("Retrying failed data loads...");
                    await Promise.allSettled([
                        fetchEquipmentData(),
                        fetchTransportationFees(),
                        fetchPaymentConditions(),
                        fetchPaymentMethods()
                    ]);
                    
                    // Repopulate UI with fresh data
                    populateTransportLocations();
                    populatePaymentConditions();
                    populatePaymentMethods();
                    populateEquipmentDropdowns();
                    console.log("Background data reload completed.");
                }, 2000);
            }

            populateTransportLocations();
            populatePaymentConditions();
            populatePaymentMethods();
            populateEquipmentDropdowns(); 
            
            // Initialize app state
            resetAll(true); // Pass true to indicate loading state
            addItem(); // Add one equipment box for user to start with
            
            document.getElementById('globalDatesApply').onchange = handleGlobalDatesApplyChange;
            document.getElementById('globalTimesApply').onchange = handleGlobalTimesApplyChange;
            document.getElementById('iva').onchange = handleGlobalPriceControlsChange;
            document.getElementById('discount').oninput = handleGlobalPriceControlsChange;
            document.getElementById('transportLocation').onchange = handleGlobalPriceControlsChange;

            document.getElementById('searchEquipmentInput').addEventListener('input', (e) => {
                displayEquipmentList(e.target.value);
            });

            document.getElementById('addEquipmentForm').addEventListener('submit', handleAddNewEquipment);
            
            // Tab navigation
            document.querySelectorAll('.tab-link').forEach(tab => {
                tab.addEventListener('click', (event) => {
                    const tabLink = event.target.closest('.tab-link');
                    if (!tabLink) return;
                    
                    const tabName = tabLink.getAttribute('data-tab');
                    
                    // Update tab links
                    document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
                    tabLink.classList.add('active');

                    // Update tab content
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                        if (content.id === `${tabName}Section`) {
                            content.classList.add('active');
                        }
                    });
                });
            });

            document.getElementById('saveQuoteBtn').addEventListener('click', saveQuote);
            document.getElementById('viewCurrentQuoteBtn').addEventListener('click', () => {
                const currentQuoteData = getQuoteDataForSave();
                openQuoteInNewWindow(currentQuoteData);
            });

            displayEquipmentList();
            displaySavedQuotes();
        }

        function showTab(tabIdToShow, clickedButton) {
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.style.display = 'none';
            });

            const tabLinks = document.querySelectorAll('.tab-link');
            tabLinks.forEach(link => {
                link.classList.remove('active');
            });

            document.getElementById(tabIdToShow).style.display = 'block';
            clickedButton.classList.add('active');
        }

        /* --- Equipment Management Functions --- */
        let currentlyEditingEquipmentName = null;

        function displayEquipmentList(searchTerm = '') {
            const equipmentTableDiv = document.getElementById('equipmentTable');
            equipmentTableDiv.innerHTML = ''; // Clear previous content
            equipmentTableDiv.className = 'equipment-cards-container'; // Use a container class for flexbox styling

            const lowercasedSearchTerm = searchTerm.toLowerCase();

            const filteredEquipment = Object.keys(equipmentData).filter(name =>
                name.toLowerCase().includes(lowercasedSearchTerm)
            );

            if (filteredEquipment.length === 0) {
                equipmentTableDiv.innerHTML = '<p>Nenhum equipamento encontrado.</p>';
                return;
            }

            // Sort alphabetically by equipment name
            filteredEquipment.sort((a, b) => a.localeCompare(b));

            filteredEquipment.forEach(equipName => {
                const equipment = equipmentData[equipName];
                if (!equipment) return;

                const card = document.createElement('div');
                card.className = 'equipment-card';

                // Use the processed image_url and encode it for the URL with optimization
                const imageUrl = equipment.image_url ? `imagens/${encodeURIComponent(equipment.image_url)}` : 'imagens/logo-orca.png';

                card.innerHTML = `
                    <div class="equipment-card-image-container">
                        <img src="${imageUrl}" alt="${equipName}" onerror="this.onerror=null;this.src='imagens/logo-orca.png'; console.error('Failed to load image for ${equipName} at path: ${imageUrl}');">
                    </div>
                    <div class="equipment-card-content">
                        <h4 class="equipment-card-title">${equipName}</h4>
                        <p class="equipment-card-price">Preço: ${equipment.price.toFixed(2)}€</p>
                        <p class="equipment-card-description">${equipment.description.replace(/\\n/g, '<br>')}</p>
                         <div class="equipment-card-actions">
                            <button class="edit-btn" onclick="handleEditEquipment('${equipName}')"><i class="fas fa-pencil-alt"></i> Editar</button>
                            <button class="delete-btn" onclick="handleDeleteEquipment('${equipName}')"><i class="fas fa-trash-alt"></i> Apagar</button>
                        </div>
                    </div>
                `;
                equipmentTableDiv.appendChild(card);
            });
        }

        function validateFileName(filename) {
            if (!filename) return { valid: true, message: '' };
            
            // Check for problematic characters that might cause server issues
            const problematicChars = /[^\w\s.-]/g;
            const hasProblematicChars = problematicChars.test(filename);
            
            if (hasProblematicChars) {
                return {
                    valid: false,
                    message: 'O nome do ficheiro contém caracteres especiais que podem causar problemas. Por favor, use apenas letras, números, espaços, pontos e traços.'
                };
            }
            
            // Check for very long filenames
            if (filename.length > 255) {
                return {
                    valid: false,
                    message: 'O nome do ficheiro é muito longo. Por favor, use um nome mais curto.'
                };
            }
            
            // Check for valid file extensions
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            const hasValidExtension = validExtensions.some(ext => 
                filename.toLowerCase().endsWith(ext)
            );
            
            if (!hasValidExtension) {
                return {
                    valid: false,
                    message: 'Formato de ficheiro não suportado. Use JPG, PNG, GIF, WEBP ou BMP.'
                };
            }
            
            return { valid: true, message: '' };
        }

        function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = function() {
                    // Calculate new dimensions
                    let { width, height } = this;
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress
                    ctx.drawImage(this, 0, 0, width, height);
                    canvas.toBlob(resolve, 'image/jpeg', quality);
                };
                
                img.src = URL.createObjectURL(file);
            });
        }

        async function submitFormWithRetry(formData, maxRetries = 2) {
            let lastError;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`Attempt ${attempt} to submit form...`);
                    
                    const response = await fetch('api.php?endpoint=add_equipment', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        // Try to get error message from response
                        let errorMessage = `HTTP ${response.status}`;
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.error || errorMessage;
                        } catch (e) {
                            // If JSON parsing fails, use the status text
                            errorMessage = response.statusText || errorMessage;
                        }
                        throw new Error(errorMessage);
                    }
                    
                    const result = await response.json();
                    console.log('Form submitted successfully:', result);
                    return result;
                    
                } catch (error) {
                    console.error(`Attempt ${attempt} failed:`, error);
                    lastError = error;
                    
                    // Check for specific error types
                    const errorMessage = error.message.toLowerCase();
                    
                    if (errorMessage.includes('508') || errorMessage.includes('resource limit')) {
                        // Resource limit error - wait longer before retry
                        if (attempt < maxRetries) {
                            const delay = 2000 * attempt; // 2s, 4s
                            console.log(`Resource limit detected. Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                    } else if (errorMessage.includes('failed to fetch') || errorMessage.includes('network')) {
                        // Network error - short delay before retry
                        if (attempt < maxRetries) {
                            const delay = 1000 * attempt; // 1s, 2s
                            console.log(`Network error detected. Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                    } else {
                        // Other errors (validation, server errors) - don't retry
                        throw error;
                    }
                }
            }
            
            // If we get here, all retries failed
            throw lastError;
        }

        async function handleAddNewEquipment(event) {
            event.preventDefault(); 
            const nameInput = document.getElementById('newEquipName');
            const priceInput = document.getElementById('newEquipPrice');
            const descriptionInput = document.getElementById('newEquipDescription');
            const imageInput = document.getElementById('newEquipImage');
            const existingImageUrlInput = document.getElementById('existingImageUrl');

            let name = nameInput.value.trim();
            // Sanitize the name to remove potentially problematic characters
            // This allows letters, numbers, spaces, dots, and dashes.
            name = name.replace(/[^\w\s.-]/g, '');
            
            const price = parseFloat(priceInput.value);
            const description = descriptionInput.value.trim();

            if (!name || isNaN(price) || price <= 0) {
                alert("Por favor, preencha o nome e um preço válido (maior que zero) para o equipamento.");
                return;
            }

            if (currentlyEditingEquipmentName && name !== currentlyEditingEquipmentName && equipmentData.hasOwnProperty(name)) {
                alert("Já existe um equipamento com este novo nome. Escolha um nome diferente.");
                return;
            }

            // Validate uploaded file if present
            if (imageInput.files[0]) {
                const fileValidation = validateFileName(imageInput.files[0].name);
                if (!fileValidation.valid) {
                    alert(fileValidation.message);
                    return;
                }
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('price', price);
            formData.append('description', description);
            
            // Compress image before upload to reduce server load
            if (imageInput.files[0]) {
                try {
                    console.log('Compressing image...');
                    const compressedFile = await compressImage(imageInput.files[0]);
                    formData.append('image', compressedFile, imageInput.files[0].name);
                } catch (error) {
                    console.error('Image compression failed:', error);
                    // Fallback to original file if compression fails
                    formData.append('image', imageInput.files[0]);
                }
            }
            
            if (currentlyEditingEquipmentName) {
                formData.append('currently_editing_name', currentlyEditingEquipmentName);
                formData.append('existing_image_url', existingImageUrlInput.value);
            }

            try {
                const result = await submitFormWithRetry(formData);
                
                equipmentData = result;
                processEquipmentData();
                alert('Equipamento guardado com sucesso!');
                
                displayEquipmentList(document.getElementById('searchEquipmentInput').value);
                populateEquipmentDropdowns();
                
                cancelEditEquipment();
                nameInput.focus();
                
            } catch (error) {
                console.error('Erro ao guardar equipamento:', error);
                
                // Provide user-friendly error messages
                let userMessage = error.message;
                if (error.message.includes('Resource Limit') || error.message.includes('508')) {
                    userMessage = 'O servidor está temporariamente sobrecarregado. Sugestões:\n• Reduza o tamanho da imagem\n• Tente novamente em alguns minutos\n• Use uma imagem de menor qualidade';
                } else if (error.message.includes('Failed to fetch')) {
                    userMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
                }
                
                alert(`Erro ao guardar equipamento: ${userMessage}`);
            }
        }

        function cancelEditEquipment() {
            document.getElementById('addEquipmentForm').reset();
            document.getElementById('imagePreview').src = 'imagens/logo-orca.png';
            
            const submitButton = document.getElementById('addEquipmentForm').querySelector('button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-plus"></i> Adicionar';
            submitButton.className = 'add';
            
            currentlyEditingEquipmentName = null;
            
            const cancelButton = document.getElementById('cancelEditBtn');
            if (cancelButton) {
                cancelButton.remove();
            }
        }

        function handleEditEquipment(equipmentName) {
            console.log("handleEditEquipment called for:", equipmentName);
            if (!equipmentData.hasOwnProperty(equipmentName)) {
                alert("Equipamento não encontrado para edição.");
                console.error("Equipamento não encontrado para edição:", equipmentName);
                return;
            }
            const equip = equipmentData[equipmentName];
            document.getElementById('newEquipName').value = equipmentName;
            document.getElementById('newEquipPrice').value = equip.price;
            document.getElementById('newEquipDescription').value = equip.description || '';
            
            const imagePreview = document.getElementById('imagePreview');
            const existingImageUrlInput = document.getElementById('existingImageUrl');
            if (equip.image_url) {
                imagePreview.src = 'imagens/' + equip.image_url + '?' + new Date().getTime(); // Bust cache
                existingImageUrlInput.value = equip.image_url;
            } else {
                imagePreview.src = 'imagens/logo-orca.png';
                existingImageUrlInput.value = '';
            }
            document.getElementById('newEquipImage').value = ''; // Clear file input

            currentlyEditingEquipmentName = equipmentName;
            
            const submitButton = document.getElementById('addEquipmentForm').querySelector('button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Alterações';
            submitButton.className = 'save';

            // Add Cancel button
            const form = document.getElementById('addEquipmentForm');
            let cancelButton = document.getElementById('cancelEditBtn');
            if (!cancelButton) {
                cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.id = 'cancelEditBtn';
                cancelButton.innerHTML = '<i class="fas fa-times"></i> Cancelar';
                cancelButton.className = 'reset';
                cancelButton.style.marginLeft = '10px';
                cancelButton.onclick = () => {
                    cancelEditEquipment();
                    document.getElementById('addEquipmentFormContainer').scrollIntoView({ behavior: 'smooth' });
                };
                submitButton.insertAdjacentElement('afterend', cancelButton);
            }

            document.getElementById('newEquipName').focus();
            document.getElementById('addEquipmentFormContainer').scrollIntoView({ behavior: 'smooth' });
        }

        async function handleDeleteEquipment(equipmentName) {
            console.log("handleDeleteEquipment called for:", equipmentName);
            if (!equipmentData.hasOwnProperty(equipmentName)) {
                alert("Equipamento não encontrado para apagar.");
                console.error("Equipamento não encontrado para apagar:", equipmentName);
                return;
            }
            if (confirm(`Tem a certeza que quer apagar o equipamento "${equipmentName}"?`)) {
                try {
                    // Call the delete endpoint
                    const response = await fetch('api.php?endpoint=delete_equipment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name: equipmentName })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Only remove from local data if database deletion was successful
                        delete equipmentData[equipmentName];
                        
                        if (currentlyEditingEquipmentName === equipmentName) {
                            currentlyEditingEquipmentName = null;
                            document.getElementById('addEquipmentForm').reset();
                            document.getElementById('imagePreview').src = 'imagens/logo-orca.png';
                            const submitButton = document.getElementById('addEquipmentForm').querySelector('button[type="submit"]');
                            submitButton.innerHTML = '<i class="fas fa-plus"></i> Adicionar';
                            submitButton.className = 'add';
                            
                            const cancelButton = document.getElementById('cancelEditBtn');
                            if (cancelButton) {
                                cancelButton.remove();
                            }
                        }
                        
                        displayEquipmentList(document.getElementById('searchEquipmentInput').value); 
                        populateEquipmentDropdowns();
                        alert('Equipamento apagado com sucesso!');
                    } else {
                        throw new Error(result.error || 'Erro desconhecido ao apagar equipamento');
                    }
                    
                } catch (error) {
                    console.error('Erro ao apagar equipamento:', error);
                    alert(`Erro ao apagar equipamento: ${error.message}`);
                }
            }
        }

        // handleSaveChangesToJson function removed - no longer needed for individual deletions
        // Equipment changes are now handled directly through specific API endpoints

        function populateEquipmentDropdowns() {
            const itemDivs = document.querySelectorAll('#items .item');
            itemDivs.forEach((itemDiv) => { 
                const nameInput = itemDiv.querySelector('input[id^="name"]'); 
                const priceInput = itemDiv.querySelector('input[id^="price"]');  

                if (nameInput && nameInput.tagName === 'INPUT' && priceInput) { 
                    const currentNameValue = nameInput.value;
                    if (currentNameValue && !equipmentData.hasOwnProperty(currentNameValue)) {
                        nameInput.value = '';
                        priceInput.value = '';
                        priceInput.dataset.originalIvaInclusivePrice = '';
                        priceInput.dataset.manualOverride = 'false';
                        console.log(`Cleared name/price for calculator item previously set to deleted/renamed equipment: "${currentNameValue}"`);
                    }
                }
            });
            update(); 
        }

        function setupBackToTopButton() {
            const backToTopBtn = document.getElementById("backToTopBtn");
            if (!backToTopBtn) return;

            const scrollFunction = () => {
                const equipmentTab = document.getElementById('equipmentManagementSection');
                if (equipmentTab.classList.contains('active') && (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100)) {
                    backToTopBtn.style.display = "block";
                } else {
                    backToTopBtn.style.display = "none";
                }
            };

            window.addEventListener('scroll', scrollFunction);

            // Also check on tab click
            document.querySelectorAll('.tab-link').forEach(tab => {
                tab.addEventListener('click', () => {
                     // Use a short timeout to allow the tab's active class to update
                    setTimeout(scrollFunction, 50);
                });
            });

            backToTopBtn.addEventListener("click", () => {
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
        }

        // Dark Mode Toggle Functionality
        function initializeTheme() {
            const themeToggle = document.getElementById('themeToggle');
            const savedTheme = localStorage.getItem('theme') || 'light';
            
            // Apply saved theme
            document.documentElement.setAttribute('data-theme', savedTheme);
            
            // Toggle theme
            themeToggle.addEventListener('click', function() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                
                // Add a nice transition effect
                document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
                setTimeout(() => {
                    document.body.style.transition = '';
                }, 300);
            });
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            // Verificar se o app já foi inicializado pela função checkPasswordAndShowApp()
            // Se não foi, inicializar aqui
            if (!window.appInitialized) {
                initializeApp();
                window.appInitialized = true;
            }
            displayEquipmentList();
            setupBackToTopButton();
            initializeTheme();

            // Remover este bloco para evitar o registro duplicado do event listener
            // const addEquipmentForm = document.getElementById('addEquipmentForm');
            // if(addEquipmentForm) {
            //     addEquipmentForm.addEventListener('submit', handleAddNewEquipment);
            // }
        });