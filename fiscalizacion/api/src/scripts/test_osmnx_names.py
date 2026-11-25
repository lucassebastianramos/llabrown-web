import osmnx as ox
import networkx as nx

ox.settings.log_console = False

print("Loading graph...")
G = ox.load_graphml("brown_graph.graphml")

edges = ox.graph_to_gdfs(G, nodes=False, edges=True)

def find_edges(street_name):
    def match(name, target):
        if not isinstance(name, str):
            if isinstance(name, list):
                return any(target.lower() in str(n).lower() for n in name)
            return False
        return target.lower() in name.lower()
    
    # Fill NA to prevent errors
    if 'name' not in edges.columns:
        return []
        
    mask = edges['name'].fillna('').apply(lambda n: match(n, street_name))
    return edges[mask]

print(f"Estrada edges: {len(find_edges('Estrada'))}")
print(f"Arturo Illia edges: {len(find_edges('Arturo Illia'))}")
print(f"Illia edges: {len(find_edges('Illia'))}")

# Let's see the names of 'Illia' edges
illia_edges = find_edges('Illia')
if not illia_edges.empty:
    print(illia_edges['name'].unique())

