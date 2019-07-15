const Discord = require('discord.js');
const bot = new Discord.Client();


const token = 'NTk5ODIwMTA2ODUxNDE4MTMz.XSq2HA.MuwT65VaST-qB5khfWTtTVG140c';

const PREFIX = '';

bot.on('ready', () =>{
    console.log('Ratatouille Bot is in the pot!')
})

bot.on('message', msg => {

    let args = msg.content.substring(PREFIX.length).split(" ");

    switch(args[0]){
        case 'help':
            const embedhelp = new Discord.RichEmbed()
                .setTitle('Command List')
                .addField('About Commands', 'Characters: Remy, Emile, Alfredo, Skinner, Colette, Anton, Gusteau')
                .addField('Misc Commands', 'Synopsis, Ping');
            msg.channel.send(embedhelp)
            break;
        case 'ping':
            msg.channel.send('pong')
            break;
        case 'synopsis':
            msg.channel.send('Ratatouille is a 2007 American computer-animated comedy film produced by Pixar and released by Buena Vista Pictures Distribution. It is the eighth film produced by Pixar and was co-written and directed by Brad Bird, who took over from Jan Pinkava in 2005. The title refers to a French dish, "ratatouille", which is served at the end of the film and is also a play on words about the species of the main character. The film stars the voices of Patton Oswalt as Remy, an anthropomorphic rat who is interested in cooking; Lou Romano as Linguini, a young garbage boy who befriends Remy; Ian Holm as Skinner, the head chef of Auguste Gusteaus restaurant; Janeane Garofalo as Colette, a rôtisseur at Gusteaus restaurant; Peter O Toole as Anton Ego, a restaurant critic; Brian Dennehy as Django, Remys father and leader of his clan; Peter Sohn as Emile, Remys older brother; and Brad Garrett as Auguste Gusteau, a recently deceased chef. The plot follows a rat named Remy, who dreams of becoming a chef and tries to achieve his goal by forming an alliance with a Parisian restaurants garbage boy.')
            break;
        case 'about':
            if(args[1] === 'remy'){
                const embedremy = new Discord.RichEmbed()
                    .setTitle('Remy From The Hit Film Ratatouille')
                    .setColor(0x34495E)
                    .setThumbnail('https://lumiere-a.akamaihd.net/v1/images/open-uri20150422-20810-f3qxzs_4923c203.jpeg?region=0,0,600,600&width=160')
                    .setDescription('Rats are no strangers to rejection, but Remy, a rat who longs to be a great chef, has more than the usual obstacles to overcome.');
                msg.channel.send(embedremy)
                }
            if(args[1] === 'emile'){
                const embedemile = new Discord.RichEmbed()
                    .setTitle('Emile From The Hit Film Ratatouille')
                    .setColor(0xD35400)
                    .setThumbnail('https://lumiere-a.akamaihd.net/v1/images/open-uri20150422-20810-1baium2_5f280f6f.jpeg?region=0,0,600,600&width=160')
                    .setDescription('He is a brown (probably like his mothers fur color), overweight rat, and is slightly larger than his younger brother.');
                msg.channel.send(embedemile)
                }
            if(args[1] === 'alfredo'){
                const embedalfredo = new Discord.RichEmbed()
                    .setTitle('Alfredo From The Hit Film Ratatouille')
                    .setColor(0xE67E22)
                    .setThumbnail('https://lumiere-a.akamaihd.net/v1/images/open-uri20150422-20810-6pb5yg_c12dffb8.jpeg?region=0,0,600,600&width=160')
                    .setDescription('Alfredo Linguini, a timid and well-meaning young man, is the new garbage boy at Gusteaus.');
                msg.channel.send(embedalfredo)
                }
            if(args[1] === 'colette'){
                const embedcolette = new Discord.RichEmbed()
                .setTitle('Colette From The Hit Film Ratatouille')
                .setColor(0x7F0031)
                .setThumbnail('https://lumiere-a.akamaihd.net/v1/images/open-uri20150422-20810-qa3ihs_48c8c439.jpeg?region=0,0,600,600&width=160')
                .setDescription('Colette is the only female cook in Chef Skinners kitchen. She is a capable cook, hard working and very tough.')
            msg.channel.send(embedcolette)
            }
            if(args[1] === 'skinner'){
                const embedskinner = new Discord.RichEmbed()
                .setTitle('Chef Skinner From The Hit Film Ratatouille')
                .setColor(0xF1C40F)
                .setThumbnail('https://lumiere-a.akamaihd.net/v1/images/open-uri20150422-20810-ib8f6d_cbcd4baf.jpeg?region=0,0,600,600&width=160')
                .setDescription('He is head chef of the famous restaurant Gusteaus. He was sous-chef under Gusteau but became the head chef.')
            msg.channel.send(embedskinner)
            }
            if(args[1] === 'anton'){
                const embedanton = new Discord.RichEmbed()
                .setTitle('Anton Ego From The Hit Film Ratatouille')
                .setColor(0x1D0D56)
                .setThumbnail('https://lumiere-a.akamaihd.net/v1/images/open-uri20150422-20810-1knd2un_0cf74357.jpeg?region=0,0,600,600&width=160')
                .setDescription('Ego is an imperious and acerbic food critic, whose reviews can make or break a restaurant.')
            msg.channel.send(embedanton)
            }
            if(args[1] === 'gusteau'){
                const embedgusteau = new Discord.RichEmbed()
                .setTitle('Auguste Gusteau From The Hit Film Ratatouille')
                .setColor(0xD7DBDD)
                .setThumbnail('https://lumiere-a.akamaihd.net/v1/images/open-uri20150422-20810-1h5mmb9_ba2c3c9a.jpeg?region=0,0,600,600&width=160')
                .setDescription('He is the renowned and extremely talented chef who wrote the bestseller "Anyone Can Cook" and founded the restaurant Gusteaus.')
            msg.channel.send(embedgusteau)
            }
            break;

    }
})

bot.login(token);