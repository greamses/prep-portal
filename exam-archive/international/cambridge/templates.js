// templates.js

export function renderQuestionsHTML(svgs) {
    return `
        <!-- Q1 -->
        <div class="question-card">
            <h3>1. Pictogram: Favourite Fruit</h3>
            <div class="card-flex-row">
                <div class="svg-wrapper" style="flex-direction:column;">
                    <div class="pictogram-container">
                        <table class="pictogram-table">
                            <tr><th class="fruit-col">Fruit</th><th>Number</th></tr>
                            <tr><td class="fruit-col">Bananas</td><td><div class="svg-icons">${svgs.svg1}${svgs.svg1}${svgs.svg2}</div></td></tr>
                            <tr><td class="fruit-col">Oranges</td><td><div class="svg-icons">${svgs.svg1}${svgs.svg1}${svgs.svg1}${svgs.svg1}</div></td></tr>
                            <tr><td class="fruit-col">Peaches</td><td id="peaches-dropzone"><div class="svg-icons" id="peaches-icons"></div></td></tr>
                            <tr><td class="fruit-col">Apples</td><td><div class="svg-icons">${svgs.svg1}${svgs.svg1}</div></td></tr>
                        </table>
                        <div class="legend">${svgs.svg1} equals \\(10\\) children</div>
                    </div>
                    <div class="tools-bank">
                        <span style="font-size:1.3rem; font-weight:bold; border:none;">Tap</span>
                        <button type="button" class="icon-btn" id="add-full" title="10 children" style="border:none; scale:1.5;">${svgs.svg1}</button>
                        <button type="button" class="icon-btn" id="add-half" style="border:none; scale:1.5;" title="5 children">${svgs.svg2}</button>
                        <button type="button" id="clear-peaches" class="secondary-btn">Clear</button>
                    </div>
                </div>
                <div class="question-content">
                    <div class="question-group">
                        <label for="q1a">(a) How many children chose apples?</label>
                        <div class="input-row"><input type="number" id="q1a"> children</div>
                    </div>
                    <div class="question-group">
                        <label>(b) <strong>\\(15\\)</strong> children chose peaches. Tap circles from the bank to fill the Peaches row.</label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Q2 -->
        <div class="question-card">
            <h3>2. Clock & Time</h3>
            <div class="card-flex-row">
                <div class="svg-wrapper">${svgs.svg3}</div>
                <div class="question-content">
                    <div class="question-group">
                        <label for="q2a">(a) It takes \\(35\\) mins to walk. What time does she arrive?</label>
                        <div class="input-row"><input type="text" id="q2a" placeholder="HH:MM"></div>
                    </div>
                    <div class="question-group">
                        <label for="q2b">(b) Bell rings at \\(12:30\\) pm. Lunch is \\(45\\) mins. When does it finish?</label>
                        <div class="input-row"><input type="text" id="q2b" placeholder="HH:MM"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Q3 -->
        <div class="question-card wide-card">
            <h3>3. Number Lines</h3>
            <p>(a) Write down the number each arrow points to.</p>
            <div class="svg-wrapper" style="flex-direction: column; align-items: stretch;">
                ${svgs.svg4}
                <hr style="margin: 10px 0; border: none; border-top: 1px dashed #cbd5e1;">
                <p style="margin-bottom:10px;">(b) Estimate where the number <strong>\\(350\\)</strong> lies. <strong style="color:var(--primary);">Click the line to place an arrow.</strong></p>
                ${svgs.svg5}
                <input type="hidden" id="q3b-val">
            </div>
            <div class="input-row" style="justify-content: center; gap: 2rem; margin-top: 15px;">
                <div><label>\\(A = \\)</label><input type="number" id="q3a_A"></div>
                <div><label>\\(B = \\)</label><input type="number" id="q3a_B"></div>
            </div>
        </div>

        <!-- Q4 -->
        <div class="question-card">
            <h3>4. Geometry & Lines</h3>
            <div class="card-flex-row">
                <div class="svg-wrapper">${svgs.svg6}</div>
                <div class="question-content">
                    <p>Complete the statements:</p>
                    <div class="question-group">
                        <label>Line \\(5\\) is parallel to line:</label> <input type="number" id="q4a">
                    </div>
                    <div class="question-group">
                        <label>Line \\(4\\) is perpendicular to line \\(5\\). It is also perpendicular to line:</label> <input type="number" id="q4b">
                    </div>
                </div>
            </div>
        </div>

        <!-- Q5 -->
        <div class="question-card">
            <h3>5. Missing Numbers</h3>
            <p>Write the missing numbers to balance the equations.</p>
            <div class="missing-num-grid">
                <div class="input-row">
                    <span>(a) \\(13 \\times 100 = 130 \\times\\) </span> <input type="number" id="q5a">
                </div>
                <div class="input-row">
                    <span>(b) \\(260 \\div\\) </span> <input type="number" id="q5b"> <span> \\(= 2600 \\div 100\\)</span>
                </div>
            </div>
        </div>

        <!-- Q6 -->
        <div class="question-card wide-card">
            <h3>6. Co-ordinate Grid</h3>
            <div class="card-flex-row">
                <div class="svg-wrapper">${svgs.svg7}</div>
                <div class="question-content">
                    <p>Here is a shape drawn on a grid.</p>
                    <div class="question-group">
                        <label>(a) What are the co-ordinates of point \\(A\\)?</label>
                        <div class="input-row">( <input type="text" id="q6a_x" style="width:60px;"> , <input type="text" id="q6a_y" style="width:60px;"> )</div>
                    </div>
                    <div class="question-group">
                        <label>(b) The shape is translated \\(3\\) squares right and \\(5\\) squares up. What are the co-ordinates of the <strong>new position of point \\(A\\)</strong>?</label>
                        <div class="input-row">( <input type="text" id="q6b_x" style="width:60px;"> , <input type="text" id="q6b_y" style="width:60px;"> )</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Q7 -->
        <div class="question-card">
            <h3>7. Complete the calculation</h3>
            <p>Fill in the blank boxes in this addition problem.</p>
            <div class="addition-algo">
                <div class="algo-row">
                    <span>\\(5\\)</span><span>\\(.\\)</span><input type="number" id="q7_1" min="0" max="9"><span>\\(4\\)</span>
                </div>
                <div class="algo-row">
                    <span>\\(+\\)</span><input type="number" id="q7_2" min="0" max="9"><span>\\(.\\)</span><span>\\(3\\)</span><input type="number" id="q7_3" min="0" max="9">
                </div>
                <div class="algo-divider"></div>
                <div class="algo-row">
                    <span>\\(1\\)</span><span>\\(2\\)</span><span>\\(.\\)</span><span>\\(3\\)</span><span>\\(2\\)</span>
                </div>
            </div>
        </div>

        <!-- Q8 -->
        <div class="question-card">
            <h3>8. Fractions to Decimals</h3>
            <p><strong>Tap a fraction, then tap a decimal to connect them.</strong></p>
            <div class="q8-workspace" id="q8-container" style="position:relative; width: 280px; margin: 20px auto; padding: 10px 0;">
                <svg id="q8-lines-svg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index: 1; overflow: visible;"></svg>
                <div style="display:flex; justify-content:space-between; position:relative; z-index: 2;">
                    <div class="q8-left" style="display:flex; flex-direction:column; gap:25px;">
                        <button type="button" class="match-item q8-item-l" data-val="1/2" disabled style="background:#f1f5f9; border-color:#cbd5e1;">\\(\\frac{1}{2}\\)</button>
                        <button type="button" class="match-item q8-item-l" data-val="3/4" id="q8_l1">\\(\\frac{3}{4}\\)</button>
                        <button type="button" class="match-item q8-item-l" data-val="2/5" id="q8_l2">\\(\\frac{2}{5}\\)</button>
                        <button type="button" class="match-item q8-item-l" data-val="3/10" id="q8_l3">\\(\\frac{3}{10}\\)</button>
                    </div>
                    <div class="q8-right" style="display:flex; flex-direction:column; gap:25px;">
                        <button type="button" class="match-item q8-item-r" data-val="0.75" id="q8_r1">\\(0.75\\)</button>
                        <button type="button" class="match-item q8-item-r" data-val="0.5" disabled style="background:#f1f5f9; border-color:#cbd5e1;">\\(0.5\\)</button>
                        <button type="button" class="match-item q8-item-r" data-val="0.4" id="q8_r2">\\(0.4\\)</button>
                        <button type="button" class="match-item q8-item-r" data-val="0.3" id="q8_r3">\\(0.3\\)</button>
                        <button type="button" class="match-item q8-item-r" data-val="0.2" id="q8_r4">\\(0.2\\)</button>
                    </div>
                </div>
                <!-- Example line -->
                <svg style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index: 1; overflow: visible;">
                    <line x1="40" y1="22" x2="240" y2="82" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4"/>
                </svg>
            </div>
            <div style="text-align:center; margin-top:10px;"><button type="button" class="secondary-btn" id="q8-clear">Clear Lines</button></div>
        </div>

        <!-- Q9 -->
        <div class="question-card wide-card">
            <h3>9. Number Puzzle Rule</h3>
            <p><em>Rule: The sum of the numbers in the circles is written in the square between them.</em></p>
            <div style="display:flex; justify-content:center; align-items:center; gap:10px; opacity:0.7;">
                <div class="p-shape p-circle">\\(1.2\\)</div><div class="p-line-h"></div><div class="p-shape p-square">\\(2.6\\)</div><div class="p-line-h"></div><div class="p-shape p-circle">\\(1.4\\)</div>
            </div>
            
            <p style="margin-top:20px; text-align:center;">Use the rule to complete this diagram.</p>
            
            <div class="triangle-puzzle" style="position: relative; width: 300px; height: 260px; margin: 20px auto;">
                <svg style="position: absolute; top:0; left:0; width:100%; height:100%; z-index: 1;">
                    <line x1="150" y1="30" x2="50" y2="230" stroke="#1e293b" stroke-width="2"/>
                    <line x1="150" y1="30" x2="250" y2="230" stroke="#1e293b" stroke-width="2"/>
                    <line x1="50" y1="230" x2="250" y2="230" stroke="#1e293b" stroke-width="2"/>
                </svg>
                
                <div class="p-shape p-circle" style="position:absolute; top:0; left:120px; z-index:2; background:#e2e8f0;">\\(2.6\\)</div>
                <div class="p-shape p-square" style="position:absolute; top:110px; left:70px; z-index:2;">
                    <input type="number" step="0.1" id="q9_sl">
                </div>
                <div class="p-shape p-square" style="position:absolute; top:110px; left:170px; z-index:2; background:#e2e8f0;">\\(7.1\\)</div>
                <div class="p-shape p-circle" style="position:absolute; top:200px; left:20px; z-index:2; background:#e2e8f0;">\\(3.9\\)</div>
                <div class="p-shape p-square" style="position:absolute; top:210px; left:120px; z-index:2;">
                    <input type="number" step="0.1" id="q9_sb">
                </div>
                <div class="p-shape p-circle" style="position:absolute; top:200px; left:220px; z-index:2;">
                    <input type="number" step="0.1" id="q9_cr">
                </div>
            </div>
        </div>

        <!-- Q10 -->
        <div class="question-card">
            <h3>10. Number Sequence</h3>
            <p>Here is a number sequence. It continues in the same way. Write in the missing numbers.</p>
            <div class="input-row" style="font-size: 1.2rem; gap: 1rem; margin-top:1rem; flex-wrap:nowrap; overflow-x:auto; padding-bottom:10px;">
                <input type="number" step="0.1" id="q10_1" style="width:70px;"> 
                <input type="number" step="0.1" id="q10_2" style="width:70px;"> 
                <span>\\(0.8\\)</span> <span>\\(1.3\\)</span> <span>\\(1.8\\)</span>
                <input type="number" step="0.1" id="q10_3" style="width:70px;">
            </div>
        </div>

        <!-- Q11 -->
        <div class="question-card wide-card">
            <h3>11. Currency Conversion</h3>
            <div class="card-flex-row">
                <div class="svg-wrapper">${svgs.svg8}</div>
                <div class="question-content">
                    <p>The currency in Malaysia is ringgits. The currency in Singapore is dollars.</p>
                    <p>The graph shows how many ringgits you get for different numbers of dollars.</p>
                    <div class="question-group">
                        <label>(a) How many ringgits do you get for <strong>\\(30\\)</strong> dollars?</label>
                        <div class="input-row"><input type="number" id="q11a"> ringgits</div>
                    </div>
                    <div class="question-group">
                        <label>(b) How many dollars do you get for <strong>\\(250\\)</strong> ringgits?</label>
                        <div class="input-row"><input type="number" id="q11b"> dollars</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Q12 -->
        <div class="question-card wide-card">
            <h3>12. Shape Rotation</h3>
            <div class="card-flex-row">
                <div class="svg-wrapper">
                    <div style="position:relative; max-width: 350px; margin: 0 auto;">
                        ${svgs.svg9}
                        <div style="display:flex; justify-content:space-between; margin-top:10px;">
                            <button type="button" class="secondary-btn" id="q12-join">Join Points</button>
                            <button type="button" class="secondary-btn" id="q12-clear">Clear</button>
                        </div>
                    </div>
                </div>
                <div class="question-content">
                    <p>Here is a triangle on a grid. It is rotated about point \\(A\\) through \\(90^\\circ\\) clockwise.</p>
                    <p style="color:var(--primary);"><strong>Tap the grid intersections to mark the \\(3\\) new corners, then click "Join Points" to draw the shape.</strong></p>
                </div>
            </div>
        </div>

        <!-- Q13 -->
        <div class="question-card wide-card">
            <h3>13. Fractions on a Number Line</h3>
            <p>Draw lines to join the mixed numbers to the correct positions on the number line.</p>
            <div class="svg-wrapper" style="margin: 1rem 0;">
                <div style="position:relative; width: 100%; text-align: center;">
                    <div id="q13-breadcrumbs" class="toggle-group" style="margin-bottom: 10px;">
                        <button type="button" class="toggle-btn q13-crumb" data-val="5.25">\\(5 \\frac{1}{4}\\)</button>
                        <button type="button" class="toggle-btn q13-crumb" data-val="6.875">\\(6 \\frac{7}{8}\\)</button>
                    </div>
                    <p style="font-size:0.9rem; color:var(--primary); margin-bottom:15px; font-weight:bold;">Tap a fraction above, then tap the line to place your arrow.</p>
                    
                    ${svgs.svg10}
                    
                    <input type="hidden" id="q13_ans_5_25" value="">
                    <input type="hidden" id="q13_ans_6_875" value="">
                    
                    <div style="margin-top: 15px;">
                        <button type="button" class="secondary-btn" id="q13-clear">Clear Arrows</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Q14 -->
        <div class="question-card wide-card">
            <h3>14. Perimeter Comparison</h3>
            <div class="svg-wrapper" style="background: transparent;">
                <div style="display:flex; justify-content:space-around; align-items:center; width:100%; flex-wrap:wrap; gap:20px;">
                    ${svgs.svg11}
                    ${svgs.svg12}
                </div>
            </div>
            <div class="question-content" style="margin-top: 1.5rem; width: 100%;">
                <div class="question-group input-row" style="gap:2rem; flex-wrap: wrap; justify-content: center; margin-bottom: 1.5rem;">
                    <div><label>Perimeter of Rectangle:</label> <input type="number" id="q14_rect" style="width: 80px;"> cm</div>
                    <div><label>Perimeter of \\(L\\)-shape:</label> <input type="number" id="q14_L" style="width: 80px;"> cm</div>
                </div>
                <div class="question-group" style="text-align: center;">
                    <label style="display:block; margin-bottom:10px;">Which shape has the larger perimeter?</label>
                    <div class="toggle-group" id="q14-toggles">
                        <button type="button" class="toggle-btn" data-val="rectangle">Rectangle</button>
                        <button type="button" class="toggle-btn" data-val="lshape">\\(L\\)-shape</button>
                        <button type="button" class="toggle-btn" data-val="same">They are the same</button>
                    </div>
                    <input type="hidden" id="q14_choice">
                </div>
            </div>
        </div>

        <!-- Q15 -->
        <div class="question-card">
            <h3>15. Distances & Routes</h3>
            <div class="card-flex-row">
                <div class="svg-wrapper">${svgs.svg13}</div>
                <div class="question-content">
                    <div class="question-group">
                        <label>(a) What is the length of the shortest route?</label>
                        <div class="input-row"><input type="number" step="0.1" id="q15a"> km</div>
                    </div>
                    <div class="question-group">
                        <label>(b) Convert \\(36\\) km to miles (\\(8\\text{km} \\approx 5\\text{mi}\\))</label>
                        <div class="input-row"><input type="number" step="0.1" id="q15b"> miles</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Q16 -->
        <div class="question-card">
            <h3>16. Mystery Numbers</h3>
            <p>\\(\\square\\) and \\(\\bigcirc\\) are different <strong>\\(2\\)-digit numbers</strong>, multiples of \\(10\\).</p>
            <div style="background: var(--light-bg); padding: 15px; border-radius: 0; text-align: center; margin-bottom: 15px;">
                <span style="font-size: 1.5rem; font-weight: bold;">\\(\\square \\times \\bigcirc = 5400\\)</span>
            </div>
            <div class="input-row" style="justify-content: center; gap: 2rem;">
                <div><label>\\(\\square = \\)</label> <input type="number" id="q16_1" style="width: 80px;"></div>
                <div><label>\\(\\bigcirc = \\)</label> <input type="number" id="q16_2" style="width: 80px;"></div>
            </div>
        </div>

        <!-- Q17 -->
        <div class="question-card">
            <h3>17. Equivalents</h3>
            <p>Paul says that <strong>\\(\\frac{1}{3}\\)</strong> is equivalent to <strong>\\(30\\%\\)</strong>. Is he correct?</p>
            <div class="input-row" style="margin: 10px 0;">
                <select id="q17_correct" style="width: 120px; font-size:1.1rem; padding: 5px;">
                    <option value=""></option><option value="yes">Yes</option><option value="no">No</option>
                </select>
            </div>
            <div class="question-group">
                <label>Explain how you know:</label>
                <textarea rows="3" style="width:100%; border: 1px solid var(--border-color); border-radius: 0; padding: 10px;" placeholder="Write your explanation here..."></textarea>
            </div>
        </div>

        <!-- Q18 -->
        <div class="question-card">
            <h3>18. Percentage Shaded</h3>
            <div class="card-flex-row">
                <div class="svg-wrapper">${svgs.svg14}</div>
                <div class="question-content">
                    <div class="question-group">
                        <label>What percentage of the shape is shaded?</label>
                        <div class="input-row"><input type="number" id="q18" style="width: 80px;"> %</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Q19 -->
        <div class="question-card wide-card">
            <h3>19. Shopping Costs</h3>
            <p>Khalid buys a kilogram of grapes, \\(2\\) oranges and a banana.</p>
            <div class="svg-wrapper" style="margin: 1rem 0; background: transparent; border: none;">
                ${svgs.svg15}
            </div>
            <div class="question-content" style="width: 100%;">
                <div class="question-group">
                    <label for="q19a">(a) How much is the total cost?</label>
                    <div class="input-row">$<input type="number" step="0.01" id="q19a" style="width: 100px;"></div>
                </div>
                <div class="question-group">
                    <label for="q19b">(b) How much change would Khalid get from a \\(\\$10\\) note?</label>
                    <div class="input-row">$<input type="number" step="0.01" id="q19b" style="width: 100px;"></div>
                </div>
            </div>
        </div>

        <!-- Q20 -->
        <div class="question-card">
            <h3>20. Digit Cards</h3>
            <p>Here are five digit cards.</p>
            <div class="input-row" style="gap: 15px; margin: 15px 0; font-size: 1.2rem; justify-content: center;">
                <span style="border:1px solid var(--border-color); border-radius:0; padding:8px 16px; background:var(--light-bg); box-shadow: 1px 1px 3px rgba(0,0,0,0.1);">0</span>
                <span style="border:1px solid var(--border-color); border-radius:0; padding:8px 16px; background:var(--light-bg); box-shadow: 1px 1px 3px rgba(0,0,0,0.1);">2</span>
                <span style="border:1px solid var(--border-color); border-radius:0; padding:8px 16px; background:var(--light-bg); box-shadow: 1px 1px 3px rgba(0,0,0,0.1);">4</span>
                <span style="border:1px solid var(--border-color); border-radius:0; padding:8px 16px; background:var(--light-bg); box-shadow: 1px 1px 3px rgba(0,0,0,0.1);">5</span>
                <span style="border:1px solid var(--border-color); border-radius:0; padding:8px 16px; background:var(--light-bg); box-shadow: 1px 1px 3px rgba(0,0,0,0.1);">8</span>
            </div>
            <p>Use four of these cards to make this statement correct. No card can be used twice.</p>
            
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; font-size: 1.5rem; margin-top: 25px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
                    <input type="number" id="q20_top" class="q20-card" min="0" max="9" style="width: 45px; height: 45px; text-align: center; font-size: 1.2rem;">
                    <div style="width: 100%; height: 2px; background: #333;"></div>
                    <input type="number" id="q20_bot" class="q20-card" min="0" max="9" style="width: 45px; height: 45px; text-align: center; font-size: 1.2rem;">
                </div>
                <div> = </div>
                <div style="display: flex; align-items: flex-end; gap: 5px;">
                    <input type="number" id="q20_int" class="q20-card" min="0" max="9" style="width: 45px; height: 45px; text-align: center; font-size: 1.2rem;">
                    <span style="font-weight: bold; font-size: 2.5rem; line-height: 0.5; padding-bottom: 5px;">.</span>
                    <input type="number" id="q20_dec" class="q20-card" min="0" max="9" style="width: 45px; height: 45px; text-align: center; font-size: 1.2rem;">
                </div>
            </div>
        </div>

        <!-- Q21 -->
        <div class="question-card">
            <h3>21. Cherry Masses</h3>
            <p>Katie measures the mass of \\(15\\) different cherries. Results in grams:</p>
            <p style="font-family: monospace; font-size: 1.1rem; background: var(--light-bg); padding: 15px; border-radius: 0; text-align: center; letter-spacing: 3px; word-wrap: break-word;">
                10 12 9 11 9 6 15 12 13 11 11 10 12 14
            </p>
            <div class="question-content" style="margin-top: 15px;">
                <div class="question-group">
                    <label for="q21a">(a) the range</label>
                    <div class="input-row"><input type="number" id="q21a" style="width: 80px;"> grams</div>
                </div>
                <div class="question-group">
                    <label for="q21b">(b) the mode</label>
                    <div class="input-row"><input type="number" id="q21b" style="width: 80px;"> grams</div>
                </div>
            </div>
        </div>

        <!-- Q22 -->
        <div class="question-card wide-card">
            <h3>22. Liquid Volumes</h3>
            <p>Here are three bottles. Two bottles contain the same amount of liquid.</p>
            <p style="color:var(--primary); font-weight:bold;">Put a cross (\\(\\times\\)) on the bottle that contains a different amount. (Tap to select)</p>
            <div class="svg-wrapper" style="margin: 1rem auto; cursor: pointer; max-width: 400px;" id="q22-container">
                ${svgs.svg16}
                <input type="hidden" id="q22_ans">
            </div>
        </div>

        <!-- Q23 -->
        <div class="question-card">
            <h3>23. Abacus Decimals</h3>
            <div class="card-flex-row">
                <div class="svg-wrapper">${svgs.svg17}</div>
                <div class="question-content">
                    <div class="question-group">
                        <label>Write the decimal number shown on the abacus.</label>
                        <div class="input-row"><input type="number" step="0.01" id="q23"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Q24 -->
        <div class="question-card wide-card">
            <h3>24. Reading Scales</h3>
            <div class="card-flex-row" style="align-items: center;">
                <div class="question-content">
                    <p>Mary weighs \\(650\\) grams of flour.</p>
                    <p style="color:var(--primary); font-weight:bold; margin-top: 10px;">Tap the scale to draw an arrow (\\(\\downarrow\\)) showing \\(650\\) grams.</p>
                    <div style="margin-top: 20px;">
                        <button type="button" class="secondary-btn" id="q24-clear">Clear Arrow</button>
                    </div>
                </div>
                <div class="svg-wrapper" style="position: relative; cursor: crosshair;">
                    ${svgs.svg18}
                    <input type="hidden" id="q24_ans">
                </div>
            </div>
        </div>

        <!-- Q25 -->
        <div class="question-card">
            <h3>25. Note Values</h3>
            <div class="question-group">
                <label>How many \\(\\$10\\) notes make \\(\\$9,000\\)?</label>
                <div class="input-row"><input type="number" id="q25" style="width: 120px;"></div>
            </div>
        </div>

        <!-- Q26 -->
        <div class="question-card">
            <h3>26. Percentage Shaded (Row)</h3>
            <div class="card-flex-row" style="flex-direction: column; align-items: flex-start;">
                <div class="svg-wrapper" style="width: 100%; max-width: 400px; margin-bottom: 15px;">
                    ${svgs.svg19}
                </div>
                <div class="question-content" style="width: 100%;">
                    <div class="question-group">
                        <label>What percentage of this shape is shaded?</label>
                        <div class="input-row"><input type="number" id="q26" style="width: 80px;"> %</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Q27 -->
        <div class="question-card">
            <h3>27. Brick Wall</h3>
            <div class="card-flex-row">
                <div class="svg-wrapper" style="flex: 0 0 120px; border: none; background: transparent;">
                    ${svgs.svg20}
                </div>
                <div class="question-content">
                    <p>A builder has \\(2960\\) bricks.</p>
                    <p>He uses \\(1994\\) bricks to build a wall.</p>
                    <div class="question-group" style="margin-top: 15px;">
                        <label>How many bricks does he have left?</label>
                        <div class="input-row"><input type="number" id="q27" style="width: 100px;"> bricks</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Q28 -->
        <div class="question-card">
            <h3>28. Calculation</h3>
            <div class="question-group">
                <label>Calculate \\(17.3 \\times 4\\)</label>
                <div class="input-row"><input type="number" step="0.1" id="q28" style="width: 120px;"></div>
            </div>
        </div>
    `;
}