config = {
	'ssl': {
		'key':   '...',
		'cert':  '...',
		'ca':    '...'
	},
	'servers': [
		{'port': 7732},
		{'host': '10.0.0.101', 'port':80},
		{'host': '10.0.0.101', 'port':443, 'ssl':true},
	]
};

exports.get = function(v) { return config[v]; }
