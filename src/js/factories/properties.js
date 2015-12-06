(function () {
    var _ = require('lodash');
    var h = require('virtual-dom/h');
    var that = {};

    that.get = function (option ,configService, indexName ) {
        if (option) {
            var localProperty = _.cloneDeep(option);
            // sometimes we will get an index name, this will be a name with an index.
            // e.g. series are arrays and have indexes : series.0.name
            localProperty.fullname = !_.isUndefined(indexName) ? indexName: option.fullname;
            return that.createProperty(localProperty, configService);
        }
    };

    that.createProperty = function (property, configService) {
        var element;
        var configValue = configService.getValue(property.fullname);

        if (!_.isUndefined(property.defaults) && !_.isArray(property.defaults)) {
            // defaults is a string
            if(_.isString(property.defaults)){
                property.defaults = property.defaults.replace(/\[|\]|\"/g, '').split(',');
            }
            if (property.defaults.length == 1) {
                property.defaults = _.first(property.defaults).trim();
                configValue = configValue ? configValue : property.defaults;
            } else if (property.defaults.length > 1) {
                if (!configValue) {

                    configValue = [];
                }
                _.forEach(property.defaults, function (defaultValue, index) {
                    configValue[index] = configValue && configValue[index] ? configValue[index] : property.defaults[index].trim();
                })
            }
        }

        if (property.hasOwnProperty('values') && property.values !== '') {
            var options = [];
            values = property.values.replace(/\[|\]|\"|\s/g, '').split(',');
            _.forEach(values, function (value) {
                var selected = value == configValue;

                var item = h('option', {
                    value: value,
                    selected: selected
                }, value === 'null' ? '' : value);
                options.push(item);
            });
            element = h('select', {
                'onchange': function (e) {
                    if(e.target.value === 'null'){
                        configService.removeValue(property.fullname);
                    } else {
                        configService.setValue(property.fullname, e.target.value);
                    }
                }
            }, options);
        }
        else {
            switch (property.returnType.toLowerCase()) {
                case 'number':
                    var defaultValue = configValue ? configValue : '';
                    element = h('input', {
                        'type': 'number',
                        'value': defaultValue,
                        'onchange': function (e) {
                            if (parseInt(property.defaults) !== parseInt(e.target.value)) {
                                configService.setValue(property.fullname, parseInt(e.target.value));
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;

                case 'array<color>':
                    var list = [];
                    var values = !_.isUndefined(configValue) ? configValue : [];
                    _.forEach(property.defaults, function (value, index) {
                        //values.push(configValue[index]);
                        list.push(h('div', [
                            h('span', property.title + ' ' + index + ' :'),
                            h('input', {
                                'type': 'text',
                                'value': !_.isUndefined(configValue) && !_.isUndefined(configValue[index]) ? configValue[index] : property.defaults[index],
                                'onchange': function (e) {
                                    values[index] = e.target.value != '' ? e.target.value : property.defaults[index];
                                    if (_.isEqual(property.defaults, values)) {
                                        configService.removeValue(property.fullname);
                                    } else {
                                        configService.setValue(property.fullname, values);
                                    }
                                }
                            })
                        ]))
                    });
                    element = h('div', list);
                    break;

                case 'boolean':
                    property.defaults = property.defaults == 'true';
                    if(_.isString(configValue)){
                        configValue = configValue == 'true';
                    }

                    element = h('input', {
                        'type': 'checkbox',
                        'checked': configValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.checked) {
                                configService.setValue(property.fullname, e.target.checked);
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;

                case 'string':
                    element = h('input', {
                        'type': 'text',
                        'value': configValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.value) {
                                configService.setValue(property.fullname, e.target.value);
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;
                case 'function':
                    element = h('input', {
                        'type': 'text',
                        'value': configValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.value) {
                                configService.setValue(property.fullname, eval(e.target.value));
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;
                default:
                    element = h('input', {
                        'type': 'text',
                        'value': configValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.value) {
                                configService.setValue(property.fullname, e.target.value);
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;
            }
        }
        // return div > label > title + element
        return h('div',h('label',{title:property.description},[property.title,element]));
    };

    module.exports = that;
})();