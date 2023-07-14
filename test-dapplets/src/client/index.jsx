class Bus {
    _callbacks = {};

    constructor() {
        window.addEventListener('message', async (e) => {
            try {
                const data = JSON.parse(e.data);
                if (!data || !data.topic) return;
                
                const callbacks = this._callbacks[data.topic] || [];
                
                for (const callback of callbacks) {
                    const result = callback.apply({}, [data.message]);
                    if (data.id) {
                        const msg = JSON.stringify({ 
                            id: data.id, 
                            result: result 
                        });
                        window.parent.postMessage(msg, '*');
                    }
                }
            } catch (ex) { }
        });
    }

    publish(topic, message) {
        const msg = JSON.stringify({ topic, message });
        window.parent.postMessage(msg, '*');
    }

    subscribe(topic, handler) {
        if (!this._callbacks[topic]) {
            this._callbacks[topic] = [];
        }
        this._callbacks[topic].push(handler);
    }

    unsubscribe(topic) {
        this._callbacks[topic] = [];
    }
}


class Index extends React.Component {
    bus = null;
    subId = 0;

    constructor(props) {
        super(props);

        this.state = {
            markets: [],
            tweet: {
                authorFullname: null,
                authorImg: null,
                authorUsername: null,
                id: null,
                text: null
            }
        };

        this.bus = new Bus();

        this.bus.subscribe('tweet_select', (tweet) => {
            this.setState(state => ({ tweet }));
            this.handleChange();
            return ++this.subId;
        });

        this.search = React.createRef();
        this.searchType = React.createRef();
    }

    async handleChange() {
        const response = await fetch('/api/markets');
        const json = await response.json();

        const search = this.search.current.value;
        const searchType = this.searchType.current.value;

        let markets = [];

        if (searchType == 'Tweet') {
            markets = json.markets.filter(m => json.tweets_with_PM[this.state.tweet.id] && json.tweets_with_PM[this.state.tweet.id].indexOf(m.id) != -1);
        } else {
            markets = json.markets.map(m => {
                const mapping = json.tweets_with_PM[this.state.tweet.id];
                m.isAttached = !!mapping && mapping.indexOf(m.id) != -1;
                return m;
            });
        }

        markets = markets.filter(m => m && m.title.toLowerCase().indexOf(search.toLowerCase()) != -1);

        this.setState(state => ({ markets: markets }));
    }

    async handleAttachClick(market, event) {
        const button = event.currentTarget;
        const data = {
            market: market.id,
            tweet: this.state.tweet.id
        };

        button.disabled = true;

        this.bus.publish(this.subId.toString(), {
            type: 'pm_attach',
            message: data
        });
        this.bus.subscribe('tx_created', async () => {
            const response = await fetch('/api/markets/attach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            await this.handleChange();
            button.disabled = false;
            this.bus.unsubscribe('tx_created');
        });
    }

    render() {
        const { state } = this;

        return (<React.Fragment>
            <header>
                <img src='/logo.svg' className='logo' />
                <h4>Prediction Markets</h4>
            </header>
            <div className="container">
                <div className="input-group mb-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text" id="basic-addon1">⌕</span>
                    </div>
                    <input onChange={() => this.handleChange()} ref={this.search} type="text" className="form-control" placeholder="Search" aria-label="Search" aria-describedby="basic-addon1" />
                    <select className="form-control" onChange={() => this.handleChange()} ref={this.searchType}>
                        <option>Tweet</option>
                        <option>Global</option>
                    </select>
                </div>

                {!state.tweet.id ? <p>Select tweet</p> : (
                    state.markets.length > 0 ? state.markets.sort((a, b) => {
                        const textA = a.title.toUpperCase();
                        const textB = b.title.toUpperCase();
                        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                    }).map(m => (<div className="card" key={m.id}>
                        <div className="card-body">
                            <h5 className="card-title">{m.title}</h5>
                            <p className="card-subtitle mb-2 text-muted">Volume: {m.total}</p>
                            <p className="card-subtitle mb-2 text-muted">Exp: {m.expDate}</p>
                            {m.results.map((m, i) => (<button key={i} type="button" className="btn btn-dark btn-sm">{m.text} - {m.value}</button>))}
                            {m.isAttached === false ? (<div>
                                <button onClick={(e) => this.handleAttachClick(m, e)} type="button" className="btn btn-primary btn-sm">Attach tweet</button>
                            </div>) : null}
                        </div>
                    </div>)) : <p>There is no related prediction markets.</p>
                )}
            </div>
        </React.Fragment>);
    }
}

ReactDOM.render(<Index />, document.getElementById('root'));