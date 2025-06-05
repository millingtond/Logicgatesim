#!/usr/bin/env python3
"""
Script to update Logic Gate Simulator files with fixes for:
1. Word notation display (AND, OR, NOT instead of symbols)
2. Expression equivalence checking via truth tables
3. QuestionGenerator evaluation fixes
"""

import os
import re
import shutil
from datetime import datetime

def backup_file(filepath):
    """Create a backup of the file before modifying it."""
    backup_path = f"{filepath}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(filepath, backup_path)
    print(f"✅ Backup created: {backup_path}")
    return backup_path

def update_format_expression(content):
    """Update formatExpression method to use word notation."""
    # Pattern to find the formatExpression method
    pattern = r'formatExpression\(expression\)\s*\{[^}]*?return expression[\s\S]*?\.replace\(/\\\)/g[^}]*?\);?\s*\}'
    
    replacement = '''formatExpression(expression) {
        // Keep word notation, just add styling
        return expression
            .replace(/\\b(AND|OR|NOT|XOR|NAND|NOR)\\b/g, '<span class="operator">$1</span>')
            .replace(/\\(/g, '<span class="paren">(</span>')
            .replace(/\\)/g, '<span class="paren">)</span>');
    }'''
    
    updated_content = re.sub(pattern, replacement, content)
    return updated_content

def add_helper_methods():
    """Return the helper methods for expression checking."""
    return '''
    // Helper method to normalize expressions
    normalizeExpression(expr) {
        // First, normalize all operator symbols to words
        return expr
            .toUpperCase()
            .replace(/\\s+/g, ' ')
            // Convert symbols to words
            .replace(/[∧·*&]/g, ' AND ')
            .replace(/[∨+|]/g, ' OR ')
            .replace(/[¬!~]/g, ' NOT ')
            .replace(/⊕/g, ' XOR ')
            .replace(/⊼/g, ' NAND ')
            .replace(/⊽/g, ' NOR ')
            // Clean up multiple spaces
            .replace(/\\s+/g, ' ')
            // Remove spaces around parentheses
            .replace(/\\s*\\(\\s*/g, '(')
            .replace(/\\s*\\)\\s*/g, ')')
            // Ensure spaces around operators
            .replace(/(\\w)(AND|OR|NOT|XOR|NAND|NOR)/g, '$1 $2')
            .replace(/(AND|OR|NOT|XOR|NAND|NOR)(\\w)/g, '$1 $2')
            .trim();
    }
    
    // Helper method to extract variables from expression
    extractVariables(expression) {
        // Remove operators and parentheses, then find all variables
        const cleaned = expression
            .replace(/\\b(AND|OR|NOT|XOR|NAND|NOR)\\b/g, ' ')
            .replace(/[()]/g, ' ')
            .replace(/\\s+/g, ' ')
            .trim();
        
        const vars = cleaned.split(' ').filter(token => 
            token && /^[A-Z][A-Z0-9]*$/i.test(token)
        );
        
        return [...new Set(vars)].sort();
    }
    
    // Generate truth table for an expression
    generateTruthTable(expression, variables) {
        const table = [];
        const numRows = Math.pow(2, variables.length);
        
        for (let i = 0; i < numRows; i++) {
            const values = {};
            
            // Set variable values based on binary representation
            variables.forEach((v, j) => {
                values[v] = (i >> (variables.length - j - 1)) & 1 ? true : false;
            });
            
            // Evaluate expression with these values
            try {
                const result = this.evaluateExpression(expression, values);
                table.push(result);
            } catch (error) {
                console.error('Error evaluating expression:', error);
                table.push(false);
            }
        }
        
        return table;
    }
    
    // Evaluate expression with given variable values
    evaluateExpression(expression, values) {
        // Replace variables with their boolean values
        let expr = expression;
        
        // Sort variables by length (longest first) to avoid partial replacements
        const sortedVars = Object.keys(values).sort((a, b) => b.length - a.length);
        
        sortedVars.forEach(variable => {
            const value = values[variable] ? '1' : '0';
            // Use word boundaries to match whole variables only
            const regex = new RegExp(`\\\\b${variable}\\\\b`, 'g');
            expr = expr.replace(regex, value);
        });
        
        console.log('Expression after variable substitution:', expr);
        
        // Convert to JavaScript expression
        expr = expr
            .replace(/\\bAND\\b/gi, '&&')
            .replace(/\\bOR\\b/gi, '||')
            .replace(/\\bXOR\\b/gi, '!==')
            .replace(/\\bNAND\\b/gi, '!&&')
            .replace(/\\bNOR\\b/gi, '!||')
            .replace(/\\bNOT\\s+/gi, '!')
            .replace(/\\b1\\b/g, 'true')
            .replace(/\\b0\\b/g, 'false');
        
        // Handle NAND and NOR specially
        expr = expr.replace(/!&&/g, '&&!');
        expr = expr.replace(/!\\|\\|/g, '||!');
        
        // Fix NAND: A NAND B = !(A && B)
        expr = expr.replace(/(\\w+|\\))\\s*&&!\\s*(\\w+|\\()/g, '!($1 && $2)');
        
        // Fix NOR: A NOR B = !(A || B)
        expr = expr.replace(/(\\w+|\\))\\s*\\|\\|!\\s*(\\w+|\\()/g, '!($1 || $2)');
        
        console.log('JavaScript expression:', expr);
        
        try {
            // Use Function constructor for safe evaluation
            const func = new Function('return ' + expr);
            return func();
        } catch (error) {
            console.error('Evaluation error:', error, 'Expression:', expr);
            throw error;
        }
    }'''

def update_check_expression_answer(content, is_practice_mode=True):
    """Update checkExpressionAnswer method."""
    if is_practice_mode:
        # For PracticeMode, the method signature is different
        pattern = r'checkExpressionAnswer\(userExpression\)\s*\{[\s\S]*?return false;\s*\}\s*\}'
        
        replacement = '''checkExpressionAnswer(userExpression) {
        try {
            // Normalize both expressions to use word operators
            const userNormalized = this.normalizeExpression(userExpression);
            const correctNormalized = this.normalizeExpression(this.currentQuestion.correctAnswer);
            
            console.log('Comparing expressions:');
            console.log('User (normalized):', userNormalized);
            console.log('Correct (normalized):', correctNormalized);
            
            // Get variables from both expressions
            const userVars = this.extractVariables(userNormalized);
            const correctVars = this.extractVariables(correctNormalized);
            const allVars = [...new Set([...userVars, ...correctVars])].sort();
            
            console.log('Variables:', allVars);
            
            // Generate truth tables for both expressions
            const userTable = this.generateTruthTable(userNormalized, allVars);
            const correctTable = this.generateTruthTable(correctNormalized, allVars);
            
            console.log('User truth table:', userTable);
            console.log('Correct truth table:', correctTable);
            
            // Compare truth tables
            return this.compareTruthTables(userTable, correctTable);
        } catch (error) {
            console.error('Error checking expression:', error);
            return false;
        }
    }'''
    else:
        # For AssessmentMode
        pattern = r'checkExpressionAnswer\(question, userExpression\)\s*\{[\s\S]*?return false;\s*\}\s*\}'
        
        replacement = '''checkExpressionAnswer(question, userExpression) {
        try {
            // Normalize both expressions to use word operators
            const userNormalized = this.normalizeExpression(userExpression);
            const correctNormalized = this.normalizeExpression(question.correctAnswer);
            
            console.log('Comparing expressions:');
            console.log('User (normalized):', userNormalized);
            console.log('Correct (normalized):', correctNormalized);
            
            // Get variables from both expressions
            const userVars = this.extractVariables(userNormalized);
            const correctVars = this.extractVariables(correctNormalized);
            const allVars = [...new Set([...userVars, ...correctVars])].sort();
            
            console.log('Variables:', allVars);
            
            // Generate truth tables for both expressions
            const userTable = this.generateTruthTable(userNormalized, allVars);
            const correctTable = this.generateTruthTable(correctNormalized, allVars);
            
            console.log('User truth table:', userTable);
            console.log('Correct truth table:', correctTable);
            
            // Compare truth tables
            return this.compareTruthTables(userTable, correctTable);
        } catch (error) {
            console.error('Error checking expression:', error);
            return false;
        }
    }'''
    
    updated_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    return updated_content

def add_compare_truth_tables(content):
    """Add compareTruthTables method if it doesn't exist."""
    # Check if compareTruthTables already exists
    if 'compareTruthTables' not in content:
        # Find a good place to insert it (after checkExpressionAnswer)
        insert_pattern = r'(checkExpressionAnswer\(.*?\)\s*\{[\s\S]*?\}\s*\n)'
        
        compare_method = '''
    compareTruthTables(table1, table2) {
        if (!table1 || !table2) return false;
        if (table1.length !== table2.length) return false;
        
        // Handle different table formats
        if (Array.isArray(table1[0])) {
            // Simple array format
            for (let i = 0; i < table1.length; i++) {
                const val1 = !!table1[i];
                const val2 = !!table2[i];
                if (val1 !== val2) return false;
            }
        } else if (table1[0].output !== undefined) {
            // Object format with output property
            for (let i = 0; i < table1.length; i++) {
                const val1 = !!table1[i].output;
                const val2 = !!table2[i].output;
                if (val1 !== val2) return false;
            }
        } else if (table1[0].outputs !== undefined) {
            // Object format with outputs property
            for (let i = 0; i < table1.length; i++) {
                const output1 = Object.values(table1[i].outputs)[0];
                const output2 = Object.values(table2[i].outputs)[0];
                if (!!output1 !== !!output2) return false;
            }
        }
        
        return true;
    }
'''
        
        content = re.sub(insert_pattern, r'\1' + compare_method + '\n', content)
    
    return content

def update_question_generator_evaluate(content):
    """Update evaluateExpression in QuestionGenerator.js."""
    pattern = r'evaluateExpression\(expression\)\s*\{[\s\S]*?return false;\s*\}\s*\}'
    
    replacement = '''evaluateExpression(expression) {
        // Simple expression evaluator for 0s and 1s
        let expr = expression;
        
        // First handle NOT operators before other replacements
        // Replace NOT followed by a space and a value/expression
        expr = expr.replace(/\\bNOT\\s+1\\b/gi, '0');
        expr = expr.replace(/\\bNOT\\s+0\\b/gi, '1');
        
        // Replace operators with JavaScript equivalents
        expr = expr.replace(/\\bAND\\b/gi, '&&');
        expr = expr.replace(/\\bOR\\b/gi, '||');
        expr = expr.replace(/\\bXOR\\b/gi, '!==');
        
        // Handle NAND and NOR
        expr = expr.replace(/\\bNAND\\b/gi, '!&');
        expr = expr.replace(/\\bNOR\\b/gi, '!|');
        
        // Handle remaining NOT operators (for complex expressions)
        expr = expr.replace(/\\bNOT\\s+\\(/gi, '!(');
        expr = expr.replace(/\\bNOT\\s+/gi, '!');
        
        // Fix NAND and NOR operations
        expr = expr.replace(/(\\d)\\s*!&\\s*(\\d)/g, '!($1 && $2)');
        expr = expr.replace(/(\\d)\\s*!\\|\\s*(\\d)/g, '!($1 || $2)');
        
        // Convert XOR for binary values (0/1)
        expr = expr.replace(/(\\d)\\s*!==\\s*(\\d)/g, '($1 != $2)');
        
        try {
            // Safely evaluate the expression
            return new Function('return ' + expr)() ? true : false;
        } catch (e) {
            console.error('Error evaluating expression:', expression, e);
            return false;
        }
    }'''
    
    updated_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    return updated_content

def insert_helper_methods(content, class_name):
    """Insert helper methods after formatExpression method."""
    # Find the end of formatExpression method
    pattern = r'(formatExpression\(expression\)\s*\{[^}]*?\})'
    
    # Add helper methods after formatExpression
    helper_methods = add_helper_methods()
    
    replacement = r'\1\n' + helper_methods
    
    updated_content = re.sub(pattern, replacement, content)
    return updated_content

def main():
    """Main function to update all files."""
    print("🚀 Logic Gate Simulator Update Script")
    print("=====================================\n")
    
    # Define file paths
    base_path = input("Enter the base path to your LogicGateSim folder (or press Enter for current directory): ").strip()
    if not base_path:
        base_path = "."
    
    files_to_update = {
        "PracticeMode.js": os.path.join(base_path, "js", "components", "Educational", "PracticeMode.js"),
        "AssessmentMode.js": os.path.join(base_path, "js", "components", "Educational", "AssessmentMode.js"),
        "QuestionGenerator.js": os.path.join(base_path, "js", "utils", "QuestionGenerator.js")
    }
    
    # Check if files exist
    print("📁 Checking files...")
    for name, path in files_to_update.items():
        if not os.path.exists(path):
            print(f"❌ {name} not found at: {path}")
            print("   Please ensure you're running this script from the correct directory.")
            return
        else:
            print(f"✅ Found {name}")
    
    print("\n📝 Starting updates...\n")
    
    # Update PracticeMode.js
    print("🔧 Updating PracticeMode.js...")
    try:
        with open(files_to_update["PracticeMode.js"], 'r', encoding='utf-8') as f:
            content = f.read()
        
        backup_file(files_to_update["PracticeMode.js"])
        
        # Update formatExpression
        content = update_format_expression(content)
        
        # Update checkExpressionAnswer
        content = update_check_expression_answer(content, is_practice_mode=True)
        
        # Add helper methods
        content = insert_helper_methods(content, "PracticeMode")
        
        # Add compareTruthTables if needed
        content = add_compare_truth_tables(content)
        
        with open(files_to_update["PracticeMode.js"], 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ PracticeMode.js updated successfully!")
    except Exception as e:
        print(f"❌ Error updating PracticeMode.js: {e}")
    
    # Update AssessmentMode.js
    print("\n🔧 Updating AssessmentMode.js...")
    try:
        with open(files_to_update["AssessmentMode.js"], 'r', encoding='utf-8') as f:
            content = f.read()
        
        backup_file(files_to_update["AssessmentMode.js"])
        
        # Update formatExpression
        content = update_format_expression(content)
        
        # Update checkExpressionAnswer
        content = update_check_expression_answer(content, is_practice_mode=False)
        
        # Add helper methods
        content = insert_helper_methods(content, "AssessmentMode")
        
        # Add compareTruthTables if needed
        content = add_compare_truth_tables(content)
        
        with open(files_to_update["AssessmentMode.js"], 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ AssessmentMode.js updated successfully!")
    except Exception as e:
        print(f"❌ Error updating AssessmentMode.js: {e}")
    
    # Update QuestionGenerator.js
    print("\n🔧 Updating QuestionGenerator.js...")
    try:
        with open(files_to_update["QuestionGenerator.js"], 'r', encoding='utf-8') as f:
            content = f.read()
        
        backup_file(files_to_update["QuestionGenerator.js"])
        
        # Update evaluateExpression
        content = update_question_generator_evaluate(content)
        
        with open(files_to_update["QuestionGenerator.js"], 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ QuestionGenerator.js updated successfully!")
    except Exception as e:
        print(f"❌ Error updating QuestionGenerator.js: {e}")
    
    print("\n✨ All updates completed!")
    print("\n📌 Notes:")
    print("   - Backup files have been created with timestamp")
    print("   - Test your application to ensure everything works correctly")
    print("   - If issues occur, restore from the backup files")

if __name__ == "__main__":
    main()