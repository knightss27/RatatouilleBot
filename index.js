//Creates constants for Discord.js, Youtube Downloader, and creates the bot as a Discord Client.
const Discord = require('discord.js');
const Util = require('discord.js');
const ytdl = require('ytdl-core');
const YouTube = require('simple-youtube-api');

const bot = new Discord.Client();

const youtube = new YouTube('AIzaSyCpCyUimZXwwl_eRTfXxWo_piC8VGgolNs');

//Bot token, allows the program to log in the account.
const token = 'NTk5ODIwMTA2ODUxNDE4MTMz.XSq2HA.MuwT65VaST-qB5khfWTtTVG140c';

//Creates prefix and queue constants. Makes the queue an array of key-value pairs.
const queue = new Map();
const PREFIX = '';

//Function called to play the song.
function play(guild, song) {
    //Creates server specific queues.
    const serverQueue = queue.get(guild.id);

    //If the queue is empty, delete the queue's array, and leave the voice channel.
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;

    }

    //Creates dispatcher, used to play and stop songs using ytdl.
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', () => {
        console.log('Song ended!');
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
        })
        .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    if (song.durationH >= 1) {
        var durationHours = song.durationH;
        return serverQueue.textChannel.send(`Started playing: **${song.title}** \`${durationHours}h ${song.durationM}m ${song.durationS}s\` `);
    } else {
        serverQueue.textChannel.send(`Started playing: **${song.title}** \`${song.durationM}m ${song.durationS}s\` `);
    }

    
}

//Puts the bot online, messages the console and sets the bot's user activity.
bot.on('ready', () =>{
    console.log('Ratatouille Bot is in the pot!')
    bot.user.setActivity('Ratatouille', {type: 'WATCHING'}).catch(console.error);
})

bot.on("guildMemberAdd", (member) => {
    let guild = member.guild;
    let memberTag = member.user.tag; 
    if(guild.systemChannel){ 
        guild.systemChannel.send("Welcome to the hit film Ratatouille " + memberTag);
    }
});

//I'm too bored to continue writing comments rn.
bot.on('message', async msg => {

    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(PREFIX)) return undefined;
    const args = msg.content.split(' ');
    const searchString = args.slice(1).join(' ');
    const url = args[1];
    const serverQueue = queue.get(msg.guild.id);

    if (msg.content.startsWith(`${PREFIX}play`)) {
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) return msg.channel.send('You must be in a voice channel.');
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has('CONNECT')) {
            return msg.channel.send('Need connect permissions.');
        }
        if (!permissions.has('SPEAK')) {
            return msg.channel.send('Need speaking permissions.');
        }

        try {
            var video = await youtube.getVideo(url);
        } catch (error) {
            try {
                var videos = await youtube.searchVideos(searchString, 1);
                var video = await youtube.getVideoByID(videos[0].id);
            } catch (error) {
                console.error(error);
                return msg.channel.send('No search results found.');
            }

        }

        console.log(video);

        const song = {
            id: video.id,
            title: Util.escapeMarkdown(video.title),
            url: `https://www.youtube.com/watch?v=${video.id}`,
            durationM: video.duration.minutes,
            durationS: video.duration.seconds,
            durationH: video.duration.hours,
            vthumb: video.thumbnails.maxres.url
        };

        if (!serverQueue) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(msg.guild.id, queueConstruct);
            
            queueConstruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                play(msg.guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error(`I could not join the voice channel: ${error}`);
                queue.delete(msg.guild.id);
                return undefined;
            }
        } else {
            serverQueue.songs.push(song);
            return msg.channel.send(`**${song.title}** has been added to the queue.`);
        }

        return undefined
        
    } else if (msg.content.startsWith(`${PREFIX}stop`)) {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel.');
        if (!serverQueue) return msg.channel.send('No songs to stop.');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        return undefined;

    } else if (msg.content.startsWith(`${PREFIX}skip`)) {
        if (!serverQueue) return msg.channel.send('No songs to skip, leaving the voice channel.');
        serverQueue.connection.dispatcher.end();
        msg.channel.send('Song skipped.');
        return undefined;

    } else if (msg.content.startsWith(`${PREFIX}np`)) {
        if (!serverQueue) return msg.channel.send('There is nothing playing.');
        return msg.channel.send(`Now playing: **${serverQueue.songs[0].title}**`)

    } else if (msg.content.startsWith(`${PREFIX}volume`)) {
        if (!serverQueue) return msg.channel.send('There is nothing playing.');
        if (!args[1]) return msg.channel.send(`The current volume is: ${serverQueue.volume}`);
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return msg.channel.send(`Volume set to ${serverQueue.volume}`)

    } else if (msg.content.startsWith(`${PREFIX}q`, `${PREFIX}queue`)) {
        if (!serverQueue) return msg.channel.send('There is nothing in the queue.');
        return msg.channel.send(`
__**Song Queue:**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}

**Now playing:** ${serverQueue.songs[0].title}
        `);

    } else if (msg.content.startsWith(`${PREFIX}pause`)) {
        if (serverQueue && serverQueue.playing) {
        serverQueue.playing = false;
        serverQueue.connection.dispatcher.pause();
        return msg.channel.send(`**${serverQueue.songs[0].title}** has been paused.`);
        }
        return msg.channel.send('There is no song currently playing.');

    } else if (msg.content.startsWith(`${PREFIX}resume`)) {
        if(serverQueue && !serverQueue.playing) {
        serverQueue.playing = true;
        serverQueue.connection.dispatcher.resume();
        return msg.channel.send(`Resumed playing **${serverQueue.songs[0].title}**`);
        }
        return msg.channel.send('There are no songs to resume.');

    } else if (msg.content.startsWith(`${PREFIX}thumbnail`)) {
        if (!serverQueue) return msg.channel.send('No song playing.')
        const thumbembed = new Discord.RichEmbed()
            .setImage(`${serverQueue.songs[0].vthumb}`)
            .setColor(0xFFFFFF)
        return msg.channel.send(thumbembed);
    }

    switch(args[0]){
        case 'help':
            const embedhelp = new Discord.RichEmbed()
                .setTitle('Command List')
                .addField('About Commands: about [character]', 'characters: remy, emile, alfredo, skinner, colette, anton, gusteau')
                .addField('Misc Commands', 'synopsis [about the hit film], random [gives random ratatouille themed gif], ping [pong]')
                .addField('movie','[a reasonably sketchy yet HD and free version of the movie, not responsible if you dont close any extra tabs that are generated and get yourself a virus, if you\'re that dumb I recommend using sandboxie on your browser]')
                .addField('Music', 'play ~url~ or ~search term~, stop, queue, volume ~1-10~, np (now playing)')
            msg.channel.send(embedhelp)
            break;
        case 'ping':
            msg.channel.send('pong')
            break;
        case 'delete':
            msg.channel.bulkDelete(args[1] +++ 1)
            break;
        case 'synopsis':
            const embedsynopsis = new Discord.RichEmbed()
                .setTitle('The Story of Ratatouille')
                .addField('-', 'The movie opens with a TV show featuring Chef Auguste Gusteau (Brad Garrett), owner of the best restaurant in Paris, talking about his bestselling cookbook, which proudly bears his mantra "Anyone Can Cook!" A rat named Remy (voice of Patton Oswalt) begins talking about his life in monologue fashion. Remy states that he has enhanced senses of both taste and smell, which makes him very particular about what he eats. Remys brother Emile (Peter Sohn) is impressed by this talent, but their father Django (Brian Dennehy) who leads the rats colony, could care less - until Remy reveals that he can recognize the scent of rat poison in or near food. Django puts Remy to work sniffing and testing food for the rest of the clan. Remy is not happy about the rats having to steal food from the garbage; he would prefer to go to the kitchen and take the "fresh" samples. But Django hates and fears humans so he forbids Remy (and all other members of the clan) to interact with them.')
                .addField('-', 'Despite his fathers orders, Remy spends several nights in a human home, reading Chef Gusteaus cookbook and watching television programs about cooking. Before long he has a near-expert level of knowledge about food preparation. One day, Remy takes Emile into the kitchen to get some spices that will go with some other food samples they have gathered. Emile hesitates, but agrees to go with his brother. While inside, Remy sees on TV that a famous food critic named Anton Ego (Peter O Toole), gave Gusteaus restaurant a less-than-stellar review that resulted in the restaurant losing one of its five stars. A heartbroken Gusteau died soon after, which meant the loss of another star according to tradition')
                .addField('-', 'While watching news of Gusteaus death, Remy accidentally wakes the elderly woman who lives in the home which the rats have colonized. Django orders everyone to get away as fast as possible but Remy stays behind to grab Gusteaus book. The rats manage to escape on miniature rafts into a river. Remy uses the cookbook as a flotation device but is separated from the group by a rapid current in the sewers.')
                .addField('-', 'Hours later, Remy sits, reading the cookbook, waiting for a sign of his friends and family. Through a fusion of grief, loneliness and hunger, Remy begins to hallucinate that the illustration of Chef Gusteau is talking to him. Gusteau encourages Remy to go up through the sewers and find out where he is now. Remy travels along several pipes and finds that he is in Paris - just in front of Gusteaus restaurant!')
                .addField('-', 'Inside Gusteaus, the new head chef Skinner (Ian Holm) meets Alfredo Linguini (Lou Romano), the son of Chef Gusteaus recently-deceased old friend. Linguini gives Skinner a letter written by his mother in the hope of getting a job at the restaurant. Skinner makes Linguini a garbage-boy and tells him to start work immediately.')
                .addField('-', 'As Remy watches the action in the kitchen, he spots Linguini accidentally knocking over a pot of soup and trying to cover up his error by adding random ingredients. Knowing that the combination Linguini has forged will be terrible, Remy jumps down and adds his own ingredients to the mixture. Linguini spots Remy and traps him underneath a bowl before he can run away and without anybody else noticing. Skinner spots Linguini messing with the soup and is furious, but he cannot stop the wait staff from serving the soup. A bowl is served to a food critic, who likes the concoction. Skinner still wants to fire Linguini, but another chef, Colette (Janeane Garofolo), sticks up for Linguini. Skinner relents and allows Linguini to stay.')
                .addField('-', 'Remy makes another attempt to escape, but this time Skinner spots him and Linguini manages to catch Remy in a jar. Skinner orders Linguini to take the rat away and kill it. Linguini takes Remy to a river but cannot bring himself to dispose of the rat. Linguini knows that the rat was the one who really made the soup and that Skinner will expect a duplication of the recipe. Linguini, seeing that Remy can apparently understand him, takes the rat home and essentially adopts him.')
                .addField('-', 'The next morning, Linguini sees that the rat (who he has nicknamed "Little Chef") has cooked breakfast for them both. When they arrive at the restaurant, Linguini tries to find a way to have Remy cook but without anyone else seeing. After a few tries, they find out that Remy can manipulate Linguini like a puppet by pulling on the boys hair at strategic moments. Deciding that this is their best method, Linguini and Remy spend the next few days practicing cooking in their spare time. Before long they are able to make a perfect duplicate of the soup that captured the critics attention. Skinner appoints Colette to teach Linguini about the finer points of haute cuisine. Colette does not relish the task at first; shes the only female chef, worked very hard to obtain her position and sees Linguini as a possible threat to her status.')
                
            msg.channel.send(embedsynopsis)

            const embedsynopsis2 = new Discord.RichEmbed()
                .addField('-', 'Later that night Skinner meets with an agent. We learn that since Chef Gusteaus death, Skinner has been making a profit by selling out the Gusteau name and image to a line of cheap frozen food. Taking a moment to read the letter from Linguinis mother, Skinner panics and calls his lawyer. The lawyer (Teddy Newton) explains that Gusteaus will stipulates that if no heir can be found after two years (a deadline which expires in a month), Skinner will inherit the restaurant. Apparently the letter from Linguinis mother states that Linguini is Gusteaus son, and should be the rightful heir! Skinner refuses to believe it while the lawyer suggests doing a DNA test as well as a background check.')
                .addField('-', 'Colette begins training Linguini about the fine art of cooking, and a rapport develops between the two. One night, a group of guests asks the head waiter Mustafa (John Ratzenberger) about what is "new". The staff panics, but Skinner decides to have Linguini prepare an old Gusteau-style recipe for sweetbreads. Skinner knows that Gusteau considered that recipe a "disaster" and hopes that it will be Linguinis downfall.')
                .addField('-', 'Colette begins to follow the recipe but Linguini (under Remys manipulations) alters it severely, which angers her. But a few minutes later, Mustafa bursts in and declares that the customers love the new concoction and there are several more orders for it! The other chefs toast Linguinis success later that evening. Skinner, knowing about the rat, brings Linguini into his office and pulls out a bottle of rare Château Latour in an attempt to get Linguini to talk about his "secrets" but gets nowhere.')
                .addField('-', 'Meanwhile Remy, resting outside, spots a mysterious figure in the garbage pails. He is stunned to find that it is his brother Emile! Overjoyed, Remy runs inside to steal some ingredients to fix food for his brother. Afterwards, Emile brings Remy to the new colony. Django is overjoyed to find his second son alive. Remy wants to leave the colony (and return to Linguini) but Django is opposed to the idea. Django brings Remy to a storefront that specializes in rat-killing, stating his belief that humans and rats must always be enemies. Remy, however, feels differently. He leaves the colony and goes back to Linguini.')
                .addField('-', 'Next morning, Remy finds Linguini still at the restaurant and exhausted. Colette comes in, still angry at Linguini. In an attempt to apologize, Linguini tries to confess his secret to Colette. Remy, desperate to remain hidden, forces Linguini forward so that he ends up kissing Colette. After a few seconds of hesitation, she reciprocates and a genuine attraction between the two begins.')
                .addField('-', 'Food critic Anton Ego is in his study when he hears news of Gusteaus renewed popularity. Stunned, he vows to return there and find out what is truly going on. Skinners lawyer returns to confirm Skinners worst fear - Linguini is indeed Gusteaus son. Skinner decides not to tell Linguini and let the wills deadline (a mere 3 days away) pass - after which he can fire Linguini and suffer no ill effects.')
                .addField('-', 'Later that night, Remy finds Emile with a few other rats outside the restaurant. When Remy goes inside to find the key to the food locker, he reads the documents and finds out about Linguinis parentage. Remy tries to take the documents, but Skinner spots him escaping again. Despite a thorough chase, Remy gets away and Linguini learns the truth. Skinner is fired, Linguini takes charge of the restaurant and the Gusteau frozen-food line is halted.')
                .addField('-', 'At a press conference a few days later, Anton Ego introduces himself to Linguini and promises to come by the restaurant the next night to review Gusteaus once more. Linguini, growing arrogant, decides to try and work without Remys help. In anger, Remy arranges for the rest of his rat-clan to raid the restaurant that night. Linguini finds out and throws all the rats out, including Remy.')
            msg.channel.send(embedsynopsis2)

            const embedsynopsis3 = new Discord.RichEmbed()
                .addField('-', 'That evening, Remy and Emile are sniffing for food outside the restaurant when Remy runs into a trap. It turns out that the trap was set by Skinner. Skinner wants Remy to work for him creating new frozen foods.')
                .addField('-', 'Ego arrives at the restaurant, and instead of ordering off the menu he challenges the chef to "hit [him] with your best shot." Skinner, eager to see the downfall of Linguini, asks to have the same dish that Ego is served.')
                .addField('-', 'Remy, still caged, is freed by his father and brother. Thankful, he returns to the restaurant to help Linguini. One of the chefs spots Remy returning and tries to kill the rat. But Linguini steps in and protects Remy, confessing the truth to everyone. The chefs, stunned, walk out - even Colette. Linguini thinks that there is no hope for Gusteaus.')
                .addField('-', 'Django comes in and admits that he was wrong; seeing Linguini stand up for Remy has changed his attitude about humans. Django recruits the entire rat colony to help out - they will follow Remys orders to prepare the food.')
                .addField('-', 'Just then, a health inspector arrives and sees the kitchen full of rats. One group of rats swarms the inspector, tying him up and locking him in the freezer. Before long, the rats have formed an intricate system and are preparing all the meals for the restaurant. Linguini, knowing that someone will have to wait tables, puts on a pair of roller skates and begins serving the guests.')
                .addField('-', 'Colette, having had a change of heart, returns to the restaurant to help Remy and Linguini. She asks what Remy wants to prepare for Ego. Remy selects ratatouille, an older-style recipe not traditionally up to the standards of Gusteaus (Colette calls it a "peasant dish.") Soon enough, the entrée is prepared and served to Anton Ego.')
                .addField('-', 'Ego takes a bite of the ratatouille, and immediately has a flashback to his childhood where his mother prepared the same dish to brighten his spirits after a bicycle accident. He is overwhelmed with emotion for the dish. Skinner, furious, storms into the kitchen - and is tied up and thrown into the freezer alongside the health inspector.')
                .addField('-', 'Egos heart is warmed by the fantastic meal, and insists on thanking the chef. Colette tells him that he must wait until all other customers have left. That evening, Ego learns the whole truth from Linguini, Colette and Remy. After leaving the restaurant, Ego writes a fantastic review for Gusteaus - proclaiming the chef to be "the finest in Paris", while neglecting to reveal the chefs true identity.')
                .addField('-', 'Unfortunately, the good fortune does not last. The health inspector and Skinner are freed; as a result, Gusteaus restaurant is shut down. And, as an effect, Ego loses his job and a great deal of credibility for promoting a rat-infested restaurant. Remy, telling this story to a few friends, states that Ego is now working as a small-business investor. It seems that Ego (along with Colette, Linguini and Remy) has opened a bistro named "La Ratatouille" where both humans and rats (in hidden, separate chambers) are both welcome.')
            msg.channel.send(embedsynopsis3)
            break;
        case 'about':
            if(args[1] === 'ratatouille'){
                msg.channel.send('Ratatouille is a 2007 American computer-animated comedy film produced by Pixar and released by Buena Vista Pictures Distribution. It is the eighth film produced by Pixar and was co-written and directed by Brad Bird, who took over from Jan Pinkava in 2005. The title refers to a French dish, "ratatouille", which is served at the end of the film and is also a play on words about the species of the main character. The film stars the voices of Patton Oswalt as Remy, an anthropomorphic rat who is interested in cooking; Lou Romano as Linguini, a young garbage boy who befriends Remy; Ian Holm as Skinner, the head chef of Auguste Gusteaus restaurant; Janeane Garofalo as Colette, a rôtisseur at Gusteaus restaurant; Peter O Toole as Anton Ego, a restaurant critic; Brian Dennehy as Django, Remys father and leader of his clan; Peter Sohn as Emile, Remys older brother; and Brad Garrett as Auguste Gusteau, a recently deceased chef. The plot follows a rat named Remy, who dreams of becoming a chef and tries to achieve his goal by forming an alliance with a Parisian restaurants garbage boy.')
            }
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
        case 'random':
            const ratatouille_gifs = [
                'https://media.giphy.com/media/rdQQkmjvt71iE/giphy.gif',
                'https://media.giphy.com/media/D7CSxMVMvj95e/giphy.gif',
                'https://media.giphy.com/media/101t9QwTM6y5oc/giphy.gif',
                'https://media.giphy.com/media/P07KUtlPVKvoQ/giphy.gif',
                'https://media.giphy.com/media/11lkl2WndSu3e0/giphy.gif',
                'https://media.giphy.com/media/11ps7BFraJ7HIk/giphy.gif',
                'https://media.giphy.com/media/wNDa1OZtvl6Fi/giphy.gif',
                'https://media.giphy.com/media/ePkhnWnlP1UEE/giphy.gif',
                'https://media.giphy.com/media/ex5i3xPhozedq/giphy.gif',
                'https://media.giphy.com/media/wk19wnRrhGKK4/giphy.gif',
                'https://media.giphy.com/media/Jg8G4ve9HRSpO/giphy.gif',
                'https://media.giphy.com/media/uKwkQNZ31bdny/giphy.gif',
                'https://media.giphy.com/media/CJ1AeyfeeGdOw/giphy.gif',
                'https://media.giphy.com/media/xmLqua9iqolZ6/giphy.gif',
                'https://media.giphy.com/media/2s7lb48XP0yje/giphy.gif',
                'https://media.giphy.com/media/4TbWQ8obcs4ec/giphy.gif',
                'https://media.giphy.com/media/oGbrDgrMBm1LW/giphy.gif',
                'https://media.giphy.com/media/gGS0QFLXrPAac/giphy.gif',
            ]
            msg.channel.send({file: ratatouille_gifs[Math.floor(Math.random() * ratatouille_gifs.length)]})
            break;
        case 'movie':
            const embedmovie = new Discord.RichEmbed()
            .setTitle('OpenLoad Movie Link')
            .setDescription('Be careful and close any extra windows that are created by the site.')
            .setURL('https://oload.biz/embed/GAUvvHxh1ns/Ratatouille.2007.1080p.BrRip.x264.YIFY.mp4')
            .setFooter('*only slightly illegal*')
            .setThumbnail('https://i.ytimg.com/vi/97OPjxrHIDY/maxresdefault.jpg');
            msg.channel.send(embedmovie)
            break;
    }

    return undefined;
}) 

bot.login(token);