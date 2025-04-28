const { parse } = require('css');

function validateCSS(css) {
    try {
        // Parse CSS to check for syntax errors
        const ast = parse(css);
        
        // List of allowed properties
        const allowedProperties = new Set([
            // Layout properties
            'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
            'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
            'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
            'float', 'clear', 'overflow', 'overflow-x', 'overflow-y',
            
            // Flexbox properties
            'flex', 'flex-basis', 'flex-direction', 'flex-flow', 'flex-grow',
            'flex-shrink', 'flex-wrap', 'align-content', 'align-items', 'align-self',
            'justify-content', 'order',
            
            // Box model properties
            'border', 'border-width', 'border-style', 'border-color',
            'border-top', 'border-right', 'border-bottom', 'border-left',
            'border-radius', 'border-top-left-radius', 'border-top-right-radius',
            'border-bottom-left-radius', 'border-bottom-right-radius',
            'box-shadow', 'box-sizing',
            
            // Visual properties
            'background', 'background-color', 'background-image', 'background-position',
            'background-repeat', 'background-size', 'background-attachment',
            'color', 'opacity', 'visibility', 'cursor',
            
            // Typography properties
            'font', 'font-family', 'font-size', 'font-weight', 'font-style',
            'font-variant', 'line-height', 'letter-spacing', 'text-align',
            'text-decoration', 'text-indent', 'text-transform', 'white-space',
            'word-spacing',
            
            // Animation properties
            'animation', 'animation-name', 'animation-duration', 'animation-timing-function',
            'animation-delay', 'animation-iteration-count', 'animation-direction',
            'animation-fill-mode', 'animation-play-state',
            'transition', 'transition-property', 'transition-duration',
            'transition-timing-function', 'transition-delay',
            'transform', 'transform-origin',
            
            // Filter properties
            'filter', 'backdrop-filter', 'blur', 'brightness', 'contrast',
            'drop-shadow', 'grayscale', 'hue-rotate', 'invert', 'opacity',
            'saturate', 'sepia'
        ]);

        // List of allowed functions
        const allowedFunctions = new Set([
            // Color functions
            'rgb', 'rgba', 'hsl', 'hsla',
            
            // Gradient functions
            'linear-gradient', 'radial-gradient', 'repeating-linear-gradient',
            'repeating-radial-gradient',
            
            // Transform functions
            'translate', 'translateX', 'translateY', 'translateZ',
            'scale', 'scaleX', 'scaleY', 'scaleZ',
            'rotate', 'rotateX', 'rotateY', 'rotateZ',
            'skew', 'skewX', 'skewY',
            'matrix', 'matrix3d', 'perspective',
            
            // Filter functions
            'blur', 'brightness', 'contrast', 'drop-shadow', 'grayscale',
            'hue-rotate', 'invert', 'opacity', 'saturate', 'sepia',
            
            // Animation timing functions
            'cubic-bezier', 'steps',
            
            // Other functions
            'calc', 'min', 'max', 'clamp', 'var'
        ]);

        // Check each rule
        for (const rule of ast.stylesheet.rules) {
            if (rule.type === 'rule') {
                for (const declaration of rule.declarations) {
                    // Check if property is allowed
                    if (!allowedProperties.has(declaration.property)) {
                        return {
                            valid: false,
                            message: `Property '${declaration.property}' is not allowed`
                        };
                    }

                    // Check for dangerous values
                    const value = declaration.value.toLowerCase();
                    if (value.includes('javascript:') || 
                        value.includes('expression(') || 
                        value.includes('data:') ||
                        value.includes('eval(')) {
                        return {
                            valid: false,
                            message: 'Dangerous CSS value detected'
                        };
                    }

                    // Check for allowed functions
                    const functions = value.match(/[a-zA-Z-]+\(/g) || [];
                    for (const func of functions) {
                        const funcName = func.slice(0, -1);
                        if (!allowedFunctions.has(funcName)) {
                            return {
                                valid: false,
                                message: `Function '${funcName}' is not allowed`
                            };
                        }
                    }
                }
            }
        }

        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            message: 'Invalid CSS syntax'
        };
    }
}

module.exports = { validateCSS }; 